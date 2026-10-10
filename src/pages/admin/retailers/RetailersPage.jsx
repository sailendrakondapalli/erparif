import React, { useState, useEffect } from 'react'
import { Store, Plus, Search, Edit2, Trash2, Phone, Mail } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import CustomerModal from '../customers/CustomerModal'

const RetailersPage = () => {
  const [retailers, setRetailers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedRetailer, setSelectedRetailer] = useState(null)

  useEffect(() => {
    fetchRetailers()
  }, [])

  const fetchRetailers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_type', 'retailer')
        .order('business_name')

      if (error) throw error
      setRetailers(data || [])
    } catch (error) {
      console.error('Error fetching retailers:', error)
      toast.error('Error loading retailers')
    } finally {
      setLoading(false)
    }
  }

  const filteredRetailers = retailers.filter(retailer =>
    retailer.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    retailer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    retailer.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (retailer) => {
    setSelectedRetailer(retailer)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this retailer?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Retailer deleted successfully')
      fetchRetailers()
    } catch (error) {
      console.error('Error deleting retailer:', error)
      toast.error('Error deleting retailer')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retailer Management</h1>
          <p className="text-gray-600">Manage retail partners and wholesale customers</p>
        </div>
        <button
          onClick={() => {
            setSelectedRetailer(null)
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Retailer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search retailers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Retailers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading retailers...
          </div>
        ) : filteredRetailers.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Store className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Retailers Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Get started by adding a retailer'}
            </p>
          </div>
        ) : (
          filteredRetailers.map((retailer) => (
            <div
              key={retailer.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {retailer.business_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{retailer.name}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    retailer.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {retailer.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {retailer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {retailer.phone}
                  </div>
                )}
                {retailer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {retailer.email}
                  </div>
                )}
                {retailer.gstin && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">GSTIN:</span> {retailer.gstin}
                  </div>
                )}
                {retailer.drug_license_number && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">License:</span> {retailer.drug_license_number}
                  </div>
                )}
              </div>

              {retailer.address && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {retailer.address}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-500">Balance:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    ₹{(retailer.current_balance || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(retailer)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(retailer.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={selectedRetailer ? { ...selectedRetailer, customer_type: 'retailer' } : { customer_type: 'retailer' }}
          onClose={() => {
            setShowModal(false)
            setSelectedRetailer(null)
          }}
          onSave={() => {
            setShowModal(false)
            setSelectedRetailer(null)
            fetchRetailers()
          }}
        />
      )}
    </div>
  )
}

export default RetailersPage