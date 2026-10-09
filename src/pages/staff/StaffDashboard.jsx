import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Users, Receipt } from 'lucide-react'

const StaffDashboard = () => {
  const menuItems = [
    { title: 'POS', icon: ShoppingCart, href: '/admin/pos', description: 'Point of sale system' },
    { title: 'Customers', icon: Users, href: '/admin/customers', description: 'Customer management' },
    { title: 'Sales', icon: Receipt, href: '/admin/sales', description: 'View sales history' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="mt-2 text-gray-600">Handle daily pharmacy operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                to={item.href}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard