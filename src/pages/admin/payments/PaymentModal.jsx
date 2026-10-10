import React, { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const PaymentModal = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [sales, setSales] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    customer_id: '',
    sale_id: '',
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    payment_date: new Date().toISOString().split('T')[0]
  })

  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerSales(formData.customer_id)
    } else {
      setSales([])
    }
  }, [formData.customer_id])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, business_name, customer_type, phone, current_balance')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Error loading customers')
    }
  }

  const fetchCustomerSales = async (customerId) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id, invoice_number, total, paid_amount, due_amount, payment_status, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
      toast.error('Error loading sales')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCustomerSelect = (customer) => {
    setFormData({ ...formData, customer_id: customer.id, sale_id: '' })
    setSelectedCustomer(customer)
    setSearchTerm('')
  }

  const handleSaleSelect = (saleId) => {
    const sale = sales.find(s => s.id === saleId)
    if (sale) {
      setFormData({
        ...formData,
        sale_id: saleId,
        amount: sale.due_amount || sale.total
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customer_id) {
      toast.error('Please select a customer')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      // Create payment record
      const paymentData = {
        customer_id: formData.customer_id,
        sale_id: formData.sale_id || null,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        payment_date: formData.payment_date,
        created_by: user?.id
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)

      if (paymentError) throw paymentError

      // If linked to a sale, update the sale's payment status
      if (formData.sale_id) {
        const sale = sales.find(s => s.id === formData.sale_id)
        if (sale) {
          const newPaidAmount = (parseFloat(sale.paid_amount) || 0) + parseFloat(formData.amount)
          const newDueAmount = parseFloat(sale.total) - newPaidAmount
          
          let newPaymentStatus = 'pending'
          if (newDueAmount <= 0) {
            newPaymentStatus = 'paid'
          } else if (newPaidAmount > 0) {
            newPaymentStatus = 'partial'
          }

          const { error: saleError } = await supabase
            .from('sales')
            .update({
              paid_amount: newPaidAmount,
              due_amount: Math.max(0, newDueAmount),
              payment_status: newPaymentStatus
            })
            .eq('id', formData.sale_id)

          if (saleError) throw saleError
        }
      }

      // Update customer balance
      if (selectedCustomer) {
        const newBalance = (parseFloat(selectedCustomer.current_balance) || 0) - parseFloat(formData.amount)
        
        const { error: balanceError } = await supabase
          .from('customers')
          .update({ current_balance: newBalance })
          .eq('id', formData.customer_id)

        if (balanceError) throw balanceError
      }

      toast.success('Payment recorded successfully!')
      onSave()
    } catch (error) {
      console.error('Error recording payment:', error)
      toast.error(error.message || 'Error recording payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Record a payment from customer</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              
              {selectedCustomer ? (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedCustomer.business_name || selectedCustomer.name}
                      </div>
                      {selectedCustomer.phone && (
                        <div className="text-sm text-gray-500">{selectedCustomer.phone}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        Current Balance: <span className="font-semibold">₹{(selectedCustomer.current_balance || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null)
                        setFormData({ ...formData, customer_id: '', sale_id: '', amount: '' })
                      }}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search customers..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {searchTerm && filteredCustomers.length > 0 && (
                    <div className="bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                      {filteredCustomers.slice(0, 10).map(customer => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {customer.business_name || customer.name}
                          </div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                          <div className="text-sm text-gray-600">
                            Balance: ₹{(customer.current_balance || 0).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sale Selection (Optional) */}
            {selectedCustomer && sales.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link to Sale (Optional)
                </label>
                <select
                  value={formData.sale_id}
                  onChange={(e) => handleSaleSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a sale (or leave blank for general payment)</option>
                  {sales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoice_number} - ₹{sale.total.toFixed(2)} 
                      {sale.payment_status !== 'paid' && ` (Due: ₹${(sale.due_amount || sale.total).toFixed(2)})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
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
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Transaction ID / Check No."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCustomer}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentModal
