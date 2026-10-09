import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import CustomerModal from './CustomerModal'

const CustomersPage = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm, statusFilter, typeFilter])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('customers')
        .select('*')
        .order('name')

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (typeFilter !== 'all') {
        query = query.eq('customer_type', typeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Error loading customers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = () => {
    setSelectedCustomer(null)
    setShowModal(true)
  }

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer)
    setShowModal(true)
  }

  const handleDeleteCustomer = async (customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id)

      if (error) throw error
      
      toast.success('Customer deleted successfully')
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error(error.message || 'Error deleting customer')
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedCustomer(null)
  }

  const handleModalSave = () => {
    setShowModal(false)
    setSelectedCustomer(null)
    fetchCustomers()
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getCustomerTypeBadge = (type) => {
    const badges = {
      individual: 'bg-blue-100 text-blue-800',
      retailer: 'bg-purple-100 text-purple-800',
      wholesaler: 'bg-green-100 text-green-800'
    }
    return badges[type] || badges.individual
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer information and purchase history</p>
        </div>
        <button onClick={handleAddCustomer} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
            </select>
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

      {/* Customers Table */}
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
                      Customer Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Additional Info
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
                  {customers.map((customer) => (
                    <tr key={customer.id} className="table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          {customer.patient_id && (
                            <div className="text-xs text-gray-500">
                              ID: {customer.patient_id}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {customer.phone && (
                            <div className="flex items-center text-gray-900">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center text-gray-500">
                              <Mail className="h-3 w-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                          {!customer.phone && !customer.email && (
                            <span className="text-gray-400">No contact</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCustomerTypeBadge(customer.customer_type)}`}>
                          {customer.customer_type || 'individual'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.customer_type === 'individual' && customer.date_of_birth && (
                            <div>DOB: {formatDate(customer.date_of_birth)}</div>
                          )}
                          {customer.customer_type === 'individual' && customer.gender && (
                            <div className="text-gray-500 capitalize">{customer.gender}</div>
                          )}
                          {customer.address && (
                            <div className="flex items-start text-gray-500">
                              <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{customer.address}</span>
                            </div>
                          )}
                          {!customer.date_of_birth && !customer.gender && !customer.address && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer)}
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

            {customers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding a new customer'}
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <button
                    onClick={handleAddCustomer}
                    className="mt-4 btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}

export default CustomersPage