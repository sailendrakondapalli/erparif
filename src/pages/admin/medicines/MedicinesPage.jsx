import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import MedicineModal from './MedicineModal'
import BatchModal from './BatchModal'

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showMedicineModal, setShowMedicineModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  const categories = [
    'Antibiotics',
    'Pain Relief',
    'Diabetes',
    'Vitamins',
    'Cardiovascular',
    'Respiratory',
    'Gastrointestinal',
    'Dermatology',
    'Others'
  ]

  useEffect(() => {
    fetchMedicines()
  }, [pagination.page, searchTerm, selectedCategory])

  const fetchMedicines = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('medicines')
        .select(`
          *,
          medicine_batches(
            id,
            batch_number,
            expiry_date,
            current_quantity,
            mrp,
            selling_price,
            wholesale_price
          )
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('name')

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      const from = (pagination.page - 1) * pagination.limit
      const to = from + pagination.limit - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      setMedicines(data || [])
      setPagination(prev => ({ ...prev, total: count || 0 }))
    } catch (error) {
      console.error('Error fetching medicines:', error)
      toast.error('Error loading medicines')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMedicine = async (medicineId) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return

    try {
      const { error } = await supabase
        .from('medicines')
        .update({ status: 'inactive' })
        .eq('id', medicineId)

      if (error) throw error

      toast.success('Medicine deleted successfully')
      fetchMedicines()
    } catch (error) {
      console.error('Error deleting medicine:', error)
      toast.error('Error deleting medicine')
    }
  }

  const handleEditMedicine = (medicine) => {
    setSelectedMedicine(medicine)
    setShowMedicineModal(true)
  }

  const handleAddBatch = (medicine) => {
    setSelectedMedicine(medicine)
    setShowBatchModal(true)
  }

  const getTotalStock = (batches) => {
    return batches?.reduce((total, batch) => total + (batch.current_quantity || 0), 0) || 0
  }

  const getExpiryStatus = (batches) => {
    if (!batches?.length) return 'no-stock'
    
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
    
    const hasExpired = batches.some(batch => new Date(batch.expiry_date) < now)
    const hasExpiringSoon = batches.some(batch => {
      const expiryDate = new Date(batch.expiry_date)
      return expiryDate >= now && expiryDate <= thirtyDaysFromNow
    })

    if (hasExpired) return 'expired'
    if (hasExpiringSoon) return 'expiring-soon'
    return 'good'
  }

  const getStockStatus = (medicine, totalStock) => {
    if (totalStock === 0) return 'out-of-stock'
    if (totalStock <= medicine.low_stock_threshold) return 'low-stock'
    return 'in-stock'
  }

  const StatusBadge = ({ status, text }) => {
    const statusColors = {
      'in-stock': 'bg-green-100 text-green-800',
      'low-stock': 'bg-yellow-100 text-yellow-800',
      'out-of-stock': 'bg-red-100 text-red-800',
      'good': 'bg-green-100 text-green-800',
      'expiring-soon': 'bg-yellow-100 text-yellow-800',
      'expired': 'bg-red-100 text-red-800',
      'no-stock': 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
          <p className="text-gray-600">Manage your medicine inventory</p>
        </div>
        <button
          onClick={() => {
            setSelectedMedicine(null)
            setShowMedicineModal(true)
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines by name, generic name, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Medicines Table */}
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
                      Medicine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price Range
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicines.map((medicine) => {
                    const totalStock = getTotalStock(medicine.medicine_batches)
                    const stockStatus = getStockStatus(medicine, totalStock)
                    const expiryStatus = getExpiryStatus(medicine.medicine_batches)
                    
                    const priceRange = medicine.medicine_batches?.length > 0 ? {
                      min: Math.min(...medicine.medicine_batches.map(b => b.selling_price)),
                      max: Math.max(...medicine.medicine_batches.map(b => b.selling_price))
                    } : null

                    return (
                      <tr key={medicine.id} className="table-row">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {medicine.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {medicine.generic_name} • {medicine.brand}
                            </div>
                            <div className="text-xs text-gray-400">
                              {medicine.dosage_form} • {medicine.strength}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{medicine.category}</span>
                          {medicine.prescription_required && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Rx
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {totalStock}
                          </div>
                          <div className="text-xs text-gray-500">
                            {medicine.medicine_batches?.length || 0} batch{medicine.medicine_batches?.length !== 1 ? 'es' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <StatusBadge 
                              status={stockStatus}
                              text={
                                stockStatus === 'in-stock' ? 'In Stock' :
                                stockStatus === 'low-stock' ? 'Low Stock' :
                                'Out of Stock'
                              }
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge 
                            status={expiryStatus}
                            text={
                              expiryStatus === 'good' ? 'Good' :
                              expiryStatus === 'expiring-soon' ? 'Expiring Soon' :
                              expiryStatus === 'expired' ? 'Expired' :
                              'No Stock'
                            }
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {priceRange ? (
                            <div className="text-sm text-gray-900">
                              ₹{priceRange.min.toFixed(2)}
                              {priceRange.min !== priceRange.max && ` - ₹${priceRange.max.toFixed(2)}`}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No batches</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleAddBatch(medicine)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Add Batch"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditMedicine(medicine)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {medicines.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCategory 
                    ? 'Try adjusting your search criteria' 
                    : 'Get started by adding your first medicine'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {((pagination.page - 1) * pagination.limit) + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page * pagination.limit >= pagination.total}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Medicine Modal */}
      {showMedicineModal && (
        <MedicineModal
          medicine={selectedMedicine}
          onClose={() => {
            setShowMedicineModal(false)
            setSelectedMedicine(null)
          }}
          onSave={() => {
            fetchMedicines()
            setShowMedicineModal(false)
            setSelectedMedicine(null)
          }}
        />
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <BatchModal
          medicine={selectedMedicine}
          onClose={() => {
            setShowBatchModal(false)
            setSelectedMedicine(null)
          }}
          onSave={() => {
            fetchMedicines()
            setShowBatchModal(false)
            setSelectedMedicine(null)
          }}
        />
      )}
    </div>
  )
}

export default MedicinesPage