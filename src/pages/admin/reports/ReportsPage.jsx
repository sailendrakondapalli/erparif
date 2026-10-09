import React from 'react'
import { FileBarChart, Download, Calendar, Filter } from 'lucide-react'

const ReportsPage = () => {
  const reportTypes = [
    { name: 'Sales Report', description: 'Daily, weekly, monthly sales analysis' },
    { name: 'Purchase Report', description: 'Purchase orders and supplier analysis' },
    { name: 'Profit Report', description: 'Profit margins and financial overview' },
    { name: 'GST Report', description: 'GST calculations and tax filing reports' },
    { name: 'Stock Report', description: 'Inventory levels and stock movements' },
    { name: 'Expiry Report', description: 'Medicine expiry tracking and alerts' },
    { name: 'Low Stock Report', description: 'Items below threshold levels' },
    { name: 'Customer Report', description: 'Customer purchase patterns and history' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive business reports and analytics</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </button>
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">₹2,45,680</p>
            <p className="text-sm text-gray-600">This Month Sales</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">₹1,89,450</p>
            <p className="text-sm text-gray-600">This Month Purchases</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">₹56,230</p>
            <p className="text-sm text-gray-600">This Month Profit</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">1,234</p>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{report.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                <div className="flex space-x-2">
                  <button className="btn-primary text-xs px-3 py-1">
                    Generate
                  </button>
                  <button className="btn-secondary text-xs px-3 py-1">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </button>
                </div>
              </div>
              <FileBarChart className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700">View All</button>
        </div>
        
        <div className="space-y-3">
          {[
            { name: 'Monthly Sales Report - October 2026', date: '2 hours ago', size: '2.4 MB' },
            { name: 'GST Report - Q3 2026', date: '1 day ago', size: '1.8 MB' },
            { name: 'Stock Movement Report', date: '3 days ago', size: '896 KB' },
            { name: 'Expiry Alert Report', date: '1 week ago', size: '645 KB' }
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileBarChart className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{report.name}</p>
                  <p className="text-xs text-gray-500">{report.date} • {report.size}</p>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700">
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReportsPage