import React, { useState, useEffect } from 'react'
import { ShoppingBag, Plus, TrendingUp, Package, Search, Eye, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import PurchaseModal from './PurchaseModal'

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({
    todayPurchases: 0,
    monthPurchases: 0,
    totalOrders: 0,
    avgPurchase: 0
  })

  useEffect(() => {
    fetchPurchases()
    fetchStats()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:wholesalers(business_name, owner_name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching purchases:', error)
        toast.error(`Error loading purchases: ${error.message}`)
        setPurchases([])
      } else {
        setPurchases(data || [])
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error('Error loading purchases data')
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Today's purchases
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: todayData } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('created_at', today.toISOString())

      const todayPurchases = todayData?.reduce((sum, purchase) => sum + (parseFloat(purchase.total_amount) || 0), 0) || 0

      // This month's purchases
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const { data: monthData } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('created_at', monthStart.toISOString())

      const monthPurchases = monthData?.reduce((sum, purchase) => sum + (parseFloat(purchase.total_amount) || 0), 0) || 0
      const totalOrders = monthData?.length || 0
      const avgPurchase = totalOrders > 0 ? monthPurchases / totalOrders : 0

      setStats({
        todayPurchases,
        monthPurchases,
        totalOrders,
        avgPurchase
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier?.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Manage supplier orders and inventory purchases</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Purchases</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayPurchases)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthPurchases)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Purchase</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgPurchase)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading purchases...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No purchases found
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.invoice_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.supplier?.business_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(purchase.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {purchase.payment_method || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : purchase.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {purchase.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toast('View details feature coming soon', { icon: '👁️' })}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Modal */}
      {showModal && (
        <PurchaseModal
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            fetchPurchases()
            fetchStats()
          }}
        />
      )}
    </div>
  )
}

export default PurchasesPage