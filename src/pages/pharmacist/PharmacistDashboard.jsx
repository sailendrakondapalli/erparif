import React from 'react'
import { Link } from 'react-router-dom'
import { Pill, ShoppingCart, Package, Users, FileBarChart } from 'lucide-react'

const PharmacistDashboard = () => {
  const menuItems = [
    { title: 'Medicines', icon: Pill, href: '/admin/medicines', description: 'Manage medicine inventory' },
    { title: 'POS', icon: ShoppingCart, href: '/admin/pos', description: 'Point of sale system' },
    { title: 'Inventory', icon: Package, href: '/admin/inventory', description: 'Stock management' },
    { title: 'Customers', icon: Users, href: '/admin/customers', description: 'Customer management' },
    { title: 'Reports', icon: FileBarChart, href: '/admin/reports', description: 'Sales and inventory reports' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pharmacist Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage pharmacy operations and inventory</p>
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

export default PharmacistDashboard