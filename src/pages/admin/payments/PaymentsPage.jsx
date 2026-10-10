import React, { useState, useEffect } from 'react'
import { CreditCard, Plus, Search, DollarSign, Calendar, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import PaymentModal from './PaymentModal'

const PaymentsPage = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({
    totalReceived: 0,
    outstanding: 0,
    pending: 0,
    overdue: 0
  })

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          customer:customers(name, business_name, customer_type, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Error loading payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Get all payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, status, due_date')

      if (paymentsData) {
        const totalReceived = paymentsData
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

        const outstanding = paymentsData
          .filter(p => p.status === 'partial')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

        const pending = paymentsData
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

        const today = new Date()
        const overdue = paymentsData
          .filter(p => p.status === 'pending' && p.due_date && new Date(p.due_date) < today)
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

        setStats({
          totalReceived,
          outstanding,
          pending,
          overdue
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || 
      payment.status === filterStatus

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
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Track payments, outstanding balances, and credit management</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalReceived)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.outstanding)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pending)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.overdue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.customer?.business_name || payment.customer?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.reference_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.due_date ? new Date(payment.due_date).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {payment.payment_method || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : payment.status === 'partial'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <PaymentModal
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            fetchPayments()
            fetchStats()
          }}
        />
      )}
    </div>
  )
}

export default PaymentsPage