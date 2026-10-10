import React, { useState, useEffect } from 'react'
import { Receipt, TrendingUp, Calendar, Search, Eye, Printer, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const SalesPage = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, retail, wholesale
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    totalTransactions: 0,
    avgSale: 0
  })

  useEffect(() => {
    fetchSales()
    fetchStats()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(name, phone, business_name, customer_type)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
      toast.error('Error loading sales data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Today's sales
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: todayData } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', today.toISOString())

      const todaySales = todayData?.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0) || 0

      // This month's sales
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const { data: monthData } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', monthStart.toISOString())

      const monthSales = monthData?.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0) || 0
      const totalTransactions = monthData?.length || 0
      const avgSale = totalTransactions > 0 ? monthSales / totalTransactions : 0

      setStats({
        todaySales,
        monthSales,
        totalTransactions,
        avgSale
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterType === 'all' || 
      sale.sale_type === filterType

    return matchesSearch && matchesFilter
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Track and manage all sales transactions</p>
        </div>
        <button 
          onClick={() => window.location.href = '/admin/pos'}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Receipt className="h-4 w-4 mr-2" />
          New Sale
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todaySales)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthSales)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Sale</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgSale)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Sales</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Loading sales...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No sales found
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer?.business_name || sale.customer?.name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.sale_type === 'wholesale' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sale.sale_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {sale.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : sale.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toast('View invoice feature coming soon', { icon: '👁️' })}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Eye className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => toast('Print feature coming soon', { icon: '🖨️' })}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Printer className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SalesPage