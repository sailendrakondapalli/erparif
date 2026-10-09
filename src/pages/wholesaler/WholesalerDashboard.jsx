import React from 'react'
import { ShoppingBag, Receipt, CreditCard, FileBarChart, Truck } from 'lucide-react'

const WholesalerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wholesaler Portal</h1>
          <p className="mt-2 text-gray-600">Manage your wholesale business and orders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ShoppingBag className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Supply Orders</h2>
            </div>
            <p className="text-gray-600 mb-4">View and manage supply orders from pharmacies</p>
            <button className="btn-primary">View Orders</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Truck className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Deliveries</h2>
            </div>
            <p className="text-gray-600 mb-4">Track and manage delivery schedules</p>
            <button className="btn-primary">View Deliveries</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Receipt className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
            </div>
            <p className="text-gray-600 mb-4">Generate and manage invoices</p>
            <button className="btn-primary">View Invoices</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
            </div>
            <p className="text-gray-600 mb-4">Track payments and outstanding amounts</p>
            <button className="btn-primary">View Payments</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FileBarChart className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Business Reports</h2>
            </div>
            <p className="text-gray-600 mb-4">Download business analytics and reports</p>
            <button className="btn-primary">View Reports</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WholesalerDashboard