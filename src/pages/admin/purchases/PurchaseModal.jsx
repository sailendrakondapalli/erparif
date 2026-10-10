import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Search } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const PurchaseModal = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    payment_status: 'paid'
  })
  
  // Purchase items
  const [items, setItems] = useState([])
  
  useEffect(() => {
    fetchSuppliers()
    fetchMedicines()
  }, [])

  const fetchSuppliers = async () => {
    try {
      // Fetch from wholesalers table (your actual suppliers)
      const { data, error } = await supabase
        .from('wholesalers')
        .select('id, business_name, owner_name, phone')
        .eq('status', 'active')
        .order('business_name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error('Error loading suppliers')
    }
  }

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setMedicines(data || [])
    } catch (error) {
      console.error('Error fetching medicines:', error)
      toast.error('Error loading medicines')
    }
  }

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addItem = (medicine) => {
    const existingItem = items.find(item => item.medicine_id === medicine.id)
    
    if (existingItem) {
      setItems(items.map(item =>
        item.medicine_id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setItems([...items, {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        quantity: 1,
        free_quantity: 0,
        purchase_price: 0,
        mrp: medicine.mrp || 0,
        gst_percentage: medicine.gst_percentage || 12,
        batch_number: '',
        expiry_date: ''
      }])
    }
    setSearchTerm('')
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalGst = 0
    
    items.forEach(item => {
      const itemTotal = item.quantity * parseFloat(item.purchase_price || 0)
      const gstAmount = (itemTotal * parseFloat(item.gst_percentage || 0)) / 100
      subtotal += itemTotal
      totalGst += gstAmount
    })

    const total = subtotal + totalGst

    return {
      subtotal: subtotal.toFixed(2),
      gst_amount: totalGst.toFixed(2),
      total: total.toFixed(2)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.supplier_id) {
      toast.error('Please select a supplier')
      return
    }

    if (!formData.invoice_number) {
      toast.error('Please enter invoice number')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    // Validate all items have required fields
    const invalidItem = items.find(item => 
      !item.purchase_price || 
      !item.batch_number || 
      !item.expiry_date
    )

    if (invalidItem) {
      toast.error('Please fill all item details (price, batch, expiry)')
      return
    }

    try {
      setLoading(true)
      
      const totals = calculateTotals()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          supplier_id: formData.supplier_id,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          subtotal: parseFloat(totals.subtotal),
          gst_amount: parseFloat(totals.gst_amount),
          total_amount: parseFloat(totals.total),
          payment_method: formData.payment_method,
          payment_status: formData.payment_status,
          status: 'completed',
          created_by: user?.id
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create purchase items and batches
      for (const item of items) {
        // First, create or get the batch
        const { data: batch, error: batchError } = await supabase
          .from('medicine_batches')
          .insert({
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            quantity: item.quantity + (item.free_quantity || 0),
            purchase_price: parseFloat(item.purchase_price),
            mrp: parseFloat(item.mrp),
            status: 'active'
          })
          .select()
          .single()

        if (batchError) throw batchError

        // Create purchase item
        const itemTotal = item.quantity * parseFloat(item.purchase_price)
        const gstAmount = (itemTotal * parseFloat(item.gst_percentage)) / 100

        const { error: itemError } = await supabase
          .from('purchase_items')
          .insert({
            purchase_id: purchase.id,
            medicine_id: item.medicine_id,
            batch_id: batch.id,
            quantity: item.quantity,
            free_quantity: item.free_quantity || 0,
            purchase_price: parseFloat(item.purchase_price),
            mrp: parseFloat(item.mrp),
            gst_percentage: parseFloat(item.gst_percentage),
            gst_amount: gstAmount,
            total: itemTotal + gstAmount
          })

        if (itemError) throw itemError
      }

      toast.success('Purchase added successfully!')
      onSave()
    } catch (error) {
      console.error('Error saving purchase:', error)
      toast.error(error.message || 'Error saving purchase')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">New Purchase Order</h2>
            <p className="text-sm text-gray-500 mt-1">Add inventory from supplier</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Purchase Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.business_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="INV-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            </div>

            {/* Add Products */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Medicines</h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search medicines..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {searchTerm && filteredMedicines.length > 0 && (
                <div className="bg-white border border-gray-300 rounded-lg mb-4 max-h-48 overflow-y-auto">
                  {filteredMedicines.slice(0, 10).map(medicine => (
                    <div
                      key={medicine.id}
                      onClick={() => addItem(medicine)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{medicine.name}</div>
                      <div className="text-sm text-gray-500">{medicine.generic_name}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Items Table */}
              {items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Free</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST%</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => {
                        const itemTotal = item.quantity * parseFloat(item.purchase_price || 0)
                        const gstAmount = (itemTotal * parseFloat(item.gst_percentage || 0)) / 100
                        const total = itemTotal + gstAmount

                        return (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">{item.medicine_name}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded"
                                min="1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.free_quantity}
                                onChange={(e) => updateItem(index, 'free_quantity', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded"
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.purchase_price}
                                onChange={(e) => updateItem(index, 'purchase_price', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                step="0.01"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.mrp}
                                onChange={(e) => updateItem(index, 'mrp', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.gst_percentage}
                                onChange={(e) => updateItem(index, 'gst_percentage', e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.batch_number}
                                onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded"
                                placeholder="Batch"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={item.expiry_date}
                                onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                                className="w-32 px-2 py-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-medium">
                              ₹{total.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{totals.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST:</span>
                      <span className="font-medium">₹{totals.gst_amount}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{totals.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PurchaseModal
