import React, { useState, useEffect } from 'react'
import { Package, AlertTriangle, Clock, TrendingUp, Search, Filter, Eye, Edit } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const InventoryPage = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState('all')
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    expiringSoon: 0,
    stockValue: 0
  })

  useEffect(() => {
    fetchInventory()
  }, [searchTerm, stockFilter, expiryFilter])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      
      // Fetch from the inventory view that only shows medicines with stock
      let query = supabase
        .from('inventory_view')
        .select('*')
        .order('name')

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      }

      if (stockFilter !== 'all') {
        query = query.eq('stock_status', stockFilter)
      }

      if (expiryFilter !== 'all') {
        query = query.eq('expiry_status', expiryFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setInventory(data || [])
      
      // Calculate stats
      const totalItems = data?.length || 0
      const lowStock = data?.filter(item => item.stock_status === 'low_stock').length || 0
      const expiringSoon = data?.filter(item => item.expiry_status === 'expiring_soon').length || 0
      const stockValue = data?.reduce((total, item) => {
        return total + (item.current_quantity * item.purchase_price)
      }, 0) || 0

      setStats({
        totalItems,
        lowStock,
        expiringSoon,
        stockValue
      })
      
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Error loading inventory')
    } finally {
      setLoading(false)
    }
  }

  const StatusBadge = ({ status, text }) => {
    const statusColors = {
      'in_stock': 'bg-green-100 text-green-800',
      'low_stock': 'bg-yellow-100 text-yellow-800',
      'out_of_stock': 'bg-red-100 text-red-800',
      'good': 'bg-green-100 text-green-800',
      'expiring_soon': 'bg-yellow-100 text-yellow-800',
      'expired': 'bg-red-100 text-red-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Monitor stock levels, expiry dates, and inventory movements</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.stockValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
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

          {/* Stock Filter */}
          <div className="sm:w-48">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Expiry Filter */}
          <div className="sm:w-48">
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Expiry Status</option>
              <option value="good">Good</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
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
                      Medicine Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={`${item.medicine_id}-${item.batch_id}`} className="table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.generic_name} • {item.brand}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.dosage_form} • {item.strength}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Batch: {item.batch_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Mfg: {formatDate(item.manufacturing_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Exp: {formatDate(item.expiry_date)}
                        </div>
                        {item.rack_location && (
                          <div className="text-xs text-gray-400">
                            Location: {item.rack_location}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <StatusBadge 
                            status={item.stock_status}
                            text={
                              item.stock_status === 'in_stock' ? `${item.current_quantity} units` :
                              item.stock_status === 'low_stock' ? `${item.current_quantity} units (Low)` :
                              'Out of Stock'
                            }
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge 
                          status={item.expiry_status}
                          text={
                            item.expiry_status === 'good' ? 'Good' :
                            item.expiry_status === 'expiring_soon' ? 'Expiring Soon' :
                            item.expiry_status === 'expired' ? 'Expired' :
                            'Unknown'
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Customer: ₹{item.customer_price?.toFixed(2) || item.selling_price?.toFixed(2)}</div>
                          <div className="text-gray-500">Wholesale: ₹{item.wholesale_price?.toFixed(2)}</div>
                          <div className="text-gray-400">Purchase: ₹{item.purchase_price?.toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.supplier_name || 'N/A'}
                        </div>
                        {item.supplier_drug_reg && (
                          <div className="text-xs text-gray-400">
                            Reg: {item.supplier_drug_reg}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inventory.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || stockFilter !== 'all' || expiryFilter !== 'all'
                    ? 'Try adjusting your search criteria' 
                    : 'No medicines with stock available. Add medicine batches to see inventory here.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default InventoryPage