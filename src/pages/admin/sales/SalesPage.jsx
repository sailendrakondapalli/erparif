import React from 'react'
import { Receipt, TrendingUp, Calendar, Search } from 'lucide-react'

const SalesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Track and manage all sales transactions</p>
        </div>
        <button className="btn-primary">
          <Receipt className="h-4 w-4 mr-2" />
          New Sale
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">₹45,280</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹12,45,600</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Sale</p>
              <p className="text-2xl font-bold text-gray-900">₹290</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="card">
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sales Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page will show detailed sales management features including:
          </p>
          <ul className="mt-4 text-sm text-gray-500 space-y-1">
            <li>• Sales history and invoices</li>
            <li>• Customer purchase tracking</li>
            <li>• Payment status monitoring</li>
            <li>• Returns and refunds</li>
            <li>• Sales analytics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SalesPage