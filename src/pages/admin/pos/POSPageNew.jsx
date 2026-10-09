import React, { useState, useEffect } from 'react'
import { Search, ShoppingCart, User, Plus, Minus, Trash2, CreditCard, X } from 'lucide-react'
import useCartStore from '../../../store/cartStore'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const POSPageNew = () => {
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customers, setCustomers] = useState([])

  const {
    items,
    customer,
    saleType,
    discount,
    addItem,
    updateItemQuantity,
    removeItem,
    setCustomer,
    setSaleType,
    setDiscount,
    getSubtotal,
    getGST,
    getGrandTotal,
    clearCart
  } = useCartStore()

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchMedicines()
    } else {
      setMedicines([])
    }
  }, [searchTerm])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const searchMedicines = async () => {
    setLoading(true)
    try {
      const { data: medicineData, error: medError } = await supabase
        .from('medicines')
        .select('*')
        .eq('status', 'active')
        .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`)
        .limit(20)

      if (medError) throw medError

      if (!medicineData || medicineData.length === 0) {
        setMedicines([])
        return
      }

      const medicineIds = medicineData.map(m => m.id)
      const { data: batchData, error: batchError } = await supabase
        .from('medicine_batches')
        .select('*')
        .in('medicine_id', medicineIds)
        .gt('current_quantity', 0)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      if (batchError) throw batchError

      const medicinesWithBatches = medicineData.map(medicine => ({
        ...medicine,
        medicine_batches: batchData?.filter(b => b.medicine_id === medicine.id) || []
      })).filter(m => m.medicine_batches.length > 0)

      setMedicines(medicinesWithBatches)
    } catch (error) {
      console.error('Error searching medicines:', error)
      toast.error('Error searching medicines')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (medicine, batch) => {
    if (batch.current_quantity <= 0) {
      toast.error('Out of stock')
      return
    }
    addItem(medicine, batch, 1, 0)
    toast.success('Added to cart')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Rx</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">BillSprout - Store Operations</h1>
              <p className="text-xs text-gray-500">LifeSprout Care | Pharma Mode</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online (Supabase Cloud)</span>
          </div>
          
          <select
            value={saleType || ''}
            onChange={(e) => setSaleType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Mode</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Product Search */}
        <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-hidden">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search product / salt / barcode"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
              </div>
            ) : medicines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicines.map(medicine =>
                  medicine.medicine_batches.map(batch => (
                    <div
                      key={`${medicine.id}-${batch.id}`}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleAddToCart(medicine, batch)}
                    >
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {medicine.name}
                        </h3>
                        <p className="text-xs text-gray-500">{medicine.generic_name}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                        <span>FEFO: BATCH-{batch.batch_number}</span>
                        <span>Exp: {new Date(batch.expiry_date).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-blue-900">
                            ₹{batch.selling_price}
                          </div>
                          <div className="text-xs text-gray-500">Stock: {batch.current_quantity}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(medicine, batch)
                          }}
                          className="w-8 h-8 bg-blue-900 hover:bg-blue-800 text-white rounded-full flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No medicines found</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Search for medicines to add to cart</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Billing Cart */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Branch Info */}
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="text-xs text-gray-600 mb-1">Branch: Main Store</div>
            <h2 className="text-lg font-bold text-gray-900">Billing Cart</h2>
          </div>

          {/* Customer Info */}
          <div className="px-6 py-4 border-b">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Customer Name</span>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              </div>
              <input
                type="text"
                value={customer?.name || 'Walk-in Customer'}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-600">Phone</span>
                  <input
                    type="text"
                    value={customer?.phone || '+91 7774752513'}
                    readOnly
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 mt-1"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-600">MCI No</span>
                  <input
                    type="text"
                    placeholder="MCI-88492"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {item.medicine.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Batch: {item.batch.batch_number} | Exp: {new Date(item.batch.expiry_date).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">₹{item.price} each</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {items.length > 0 && (
            <div className="border-t px-6 py-4">
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (Gross):</span>
                  <span>Rs.{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total GST:</span>
                  <span>Rs.{getGST().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Invoice Disc ({discount}%):</span>
                    <span>-Rs.{((getSubtotal() * discount) / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xl font-bold mb-4 pt-4 border-t">
                <span>GRAND TOTAL</span>
                <span>Rs.{getGrandTotal().toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm">
                  CASH
                </button>
                <button className="px-4 py-3 border-2 border-blue-900 text-blue-900 hover:bg-blue-50 rounded-lg font-semibold text-sm">
                  RAZORPAY
                </button>
              </div>

              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm mb-3">
                <option>Invoice Type: TAX INVOICE (Customer)</option>
                <option>Cash Invoice</option>
                <option>Wholesale Invoice</option>
              </select>

              <button
                onClick={clearCart}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm flex items-center justify-center"
              >
                <X className="h-4 w-4 mr-2" />
                Complete Sale & Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Select Customer</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCustomer(null)
                    setShowCustomerModal(false)
                  }}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">Walk-in Customer</div>
                  <div className="text-sm text-gray-500">No customer details</div>
                </button>
                {customers.map(cust => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      setCustomer({ ...cust, type: 'customer' })
                      setShowCustomerModal(false)
                    }}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="font-medium">{cust.name}</div>
                    <div className="text-sm text-gray-500">{cust.phone}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POSPageNew
