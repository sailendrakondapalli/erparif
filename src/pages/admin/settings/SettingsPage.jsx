import React from 'react'
import { Settings, Save, Upload, Download } from 'lucide-react'

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure pharmacy settings and preferences</p>
        </div>
        <button className="btn-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pharmacy Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pharmacy Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacy Name
                  </label>
                  <input
                    type="text"
                    defaultValue="MediCare Pharmacy"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    defaultValue="+91 98765 43210"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={3}
                  defaultValue="123 Main Street, Medical District, City, State - 123456"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="info@medicare.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    defaultValue="https://medicare.com"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Legal Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    defaultValue="22AAAAA0000A1Z5"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drug License Number
                  </label>
                  <input
                    type="text"
                    defaultValue="DL-1234567890"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select className="input-field">
                    <option>Maharashtra</option>
                    <option>Gujarat</option>
                    <option>Karnataka</option>
                    <option>Delhi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CGST Rate (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="9"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SGST Rate (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="9"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    defaultValue="INV"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Footer Text
                  </label>
                  <input
                    type="text"
                    defaultValue="Thank you for your business!"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_print"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="auto_print" className="text-sm text-gray-700">
                  Auto-print invoices after sale
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Logo and Quick Settings */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pharmacy Logo</h3>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">Rx</span>
              </div>
              <button className="btn-secondary">
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Low Stock Threshold
                </label>
                <input
                  type="number"
                  defaultValue="10"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Alert Days
                </label>
                <input
                  type="number"
                  defaultValue="30"
                  className="input-field"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow_expired_sales"
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="allow_expired_sales" className="text-sm text-gray-700">
                  Block expired medicine sales
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
              <button className="w-full btn-secondary">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </button>
              <button className="w-full btn-danger">
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage