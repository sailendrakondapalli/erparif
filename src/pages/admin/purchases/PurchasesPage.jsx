import React from 'react'
import { ShoppingBag, Plus, TrendingUp, Package } from 'lucide-react'

const PurchasesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Manage supplier orders and inventory purchases</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </button>
      </div>

      {/* Content Placeholder */}
      <div className="card">
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Purchase Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page will include purchase order functionality
          </p>
        </div>
      </div>
    </div>
  )
}

export default PurchasesPage