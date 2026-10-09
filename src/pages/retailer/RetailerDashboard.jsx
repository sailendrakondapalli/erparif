import React from 'react'
import { ShoppingBag, Receipt, CreditCard, FileBarChart } from 'lucide-react'

const RetailerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Retailer Portal</h1>
          <p className="mt-2 text-gray-600">Manage your wholesale purchases and account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ShoppingBag className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Place Order</h2>
            </div>
            <p className="text-gray-600 mb-4">Browse medicines and place wholesale orders</p>
            <button className="btn-primary">Browse Catalog</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Receipt className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
            </div>
            <p className="text-gray-600 mb-4">View your past orders and invoices</p>
            <button className="btn-primary">View Orders</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
            </div>
            <p className="text-gray-600 mb-4">Manage payments and outstanding balances</p>
            <button className="btn-primary">View Payments</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FileBarChart className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
            </div>
            <p className="text-gray-600 mb-4">Download purchase reports and statements</p>
            <button className="btn-primary">View Reports</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetailerDashboard