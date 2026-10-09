import React, { useState, useEffect } from 'react'
import { Truck, Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import WholesalerModal from './WholesalerModal'

const WholesalersPage = () => {
  const [wholesalers, setWholesalers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedWholesaler, setSelectedWholesaler] = useState(null)

  useEffect(() => {
    fetchWholesalers()
  }, [searchTerm, statusFilter])

  const fetchWholesalers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('wholesalers')
        .select('*')
        .order('business_name')

      if (searchTerm) {
        query = query.or(`business_name.ilike.%${searchTerm}%,owner_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,drug_license_number.ilike.%${searchTerm}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setWholesalers(data || [])
    } catch (error) {
      console.error('Error fetching wholesalers:', error)
      toast.error('Error loading wholesalers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWholesaler = () => {
    setSelectedWholesaler(null)
    setShowModal(true)
  }

  const handleEditWholesaler = (wholesaler) => {
    setSelectedWholesaler(wholesaler)
    setShowModal(true)
  }

  const handleDeleteWholesaler = async (wholesaler) => {
    if (!confirm(`Are you sure you want to delete ${wholesaler.business_name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('wholesalers')
        .delete()
        .eq('id', wholesaler.id)

      if (error) throw error
      
      toast.success('Wholesaler deleted successfully')
      fetchWholesalers()
    } catch (error) {
      console.error('Error deleting wholesaler:', error)
      toast.error(error.message || 'Error deleting wholesaler')
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedWholesaler(null)
  }

  const handleModalSave = () => {
    setShowModal(false)
    setSelectedWholesaler(null)
    fetchWholesalers()
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const isExpiringSoon = (dateString) => {
    if (!dateString) return false
    const expiryDate = new Date(dateString)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    return expiryDate <= threeMonthsFromNow && expiryDate > new Date()
  }

  const isExpired = (dateString) => {
    if (!dateString) return false
    return new Date(dateString) <= new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wholesaler Management</h1>
          <p className="text-gray-600">Manage suppliers and wholesaler relationships</p>
        </div>
        <button onClick={handleAddWholesaler} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Wholesaler
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name, owner, phone, or license number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wholesalers Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Terms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wholesalers.map((wholesaler) => (
                    <tr key={wholesaler.id} className="table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {wholesaler.business_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Owner: {wholesaler.owner_name}
                          </div>
                          {wholesaler.city && wholesaler.state && (
                            <div className="text-xs text-gray-400">
                              {wholesaler.city}, {wholesaler.state}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {wholesaler.phone}
                        </div>
                        {wholesaler.email && (
                          <div className="text-sm text-gray-500">
                            {wholesaler.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 flex items-center">
                            {wholesaler.drug_license_number}
                            {isExpired(wholesaler.drug_license_expiry) && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Expired
                              </span>
                            )}
                            {!isExpired(wholesaler.drug_license_expiry) && isExpiringSoon(wholesaler.drug_license_expiry) && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Expiring Soon
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500">
                            Exp: {formatDate(wholesaler.drug_license_expiry)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {wholesaler.gstin ? (
                            <>
                              <div>GSTIN: {wholesaler.gstin}</div>
                              {wholesaler.pan && (
                                <div className="text-gray-500">PAN: {wholesaler.pan}</div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">No GSTIN</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Credit: ₹{wholesaler.credit_limit?.toLocaleString() || 0}</div>
                          <div className="text-gray-500">{wholesaler.payment_terms || 0} days</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          wholesaler.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {wholesaler.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEditWholesaler(wholesaler)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWholesaler(wholesaler)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {wholesalers.length === 0 && (
              <div className="text-center py-12">
                <Truck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No wholesalers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding a new wholesaler'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={handleAddWholesaler}
                    className="mt-4 btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Wholesaler
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <WholesalerModal
          wholesaler={selectedWholesaler}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}

export default WholesalersPage