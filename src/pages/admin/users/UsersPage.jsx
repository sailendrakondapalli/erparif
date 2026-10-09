import React from 'react'
import { UserCheck, Plus, Search, Edit, Trash2, Shield } from 'lucide-react'

const UsersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users, roles, and permissions</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">1</p>
          <p className="text-sm text-gray-600">Admin</p>
        </div>
        <div className="card text-center">
          <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">2</p>
          <p className="text-sm text-gray-600">Pharmacist</p>
        </div>
        <div className="card text-center">
          <UserCheck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">3</p>
          <p className="text-sm text-gray-600">Staff</p>
        </div>
        <div className="card text-center">
          <UserCheck className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">25</p>
          <p className="text-sm text-gray-600">Patients</p>
        </div>
        <div className="card text-center">
          <UserCheck className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-600">Partners</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              className="input-field pl-10"
            />
          </div>
          <select className="input-field w-48">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="staff">Staff</option>
            <option value="patient">Patient</option>
            <option value="retailer">Retailer</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="card">
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">User Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page will include comprehensive user management features
          </p>
        </div>
      </div>
    </div>
  )
}

export default UsersPage