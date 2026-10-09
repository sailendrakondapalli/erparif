import React from 'react'
import { Receipt, User, FileText, Phone } from 'lucide-react'

const PatientDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
          <p className="mt-2 text-gray-600">Access your prescription history and profile</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <User className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">My Profile</h2>
            </div>
            <p className="text-gray-600 mb-4">View and update your personal information</p>
            <button className="btn-primary">View Profile</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Receipt className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Purchase History</h2>
            </div>
            <p className="text-gray-600 mb-4">View your past medicine purchases and invoices</p>
            <button className="btn-primary">View History</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Prescriptions</h2>
            </div>
            <p className="text-gray-600 mb-4">Upload and manage your prescriptions</p>
            <button className="btn-primary">Manage Prescriptions</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Pharmacy</h2>
            </div>
            <p className="text-gray-600 mb-4">Get in touch with our pharmacy staff</p>
            <button className="btn-primary">Contact Us</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard