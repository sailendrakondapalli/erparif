import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  customer_type: z.enum(['individual', 'retailer', 'wholesaler']).default('individual'),
  patient_id: z.string().optional(),
  emergency_contact: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

const CustomerModal = ({ customer, onClose, onSave }) => {
  const [loading, setLoading] = useState(false)
  const isEditing = !!customer

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      ...customer,
      date_of_birth: customer.date_of_birth 
        ? new Date(customer.date_of_birth).toISOString().split('T')[0] 
        : '',
      gender: customer.gender || '',
      customer_type: customer.customer_type || 'individual'
    } : {
      status: 'active',
      customer_type: 'individual',
      gender: ''
    }
  })

  const customerType = watch('customer_type')

  const onSubmit = async (data) => {
    try {
      setLoading(true)

      // Clean up empty optional fields
      const customerData = {
        ...data,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        patient_id: data.patient_id || null,
        emergency_contact: data.emergency_contact || null,
        notes: data.notes || null
      }

      if (isEditing) {
        const { error } = await supabase
          .from('customers')
          .update({
            ...customerData,
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id)

        if (error) throw error
        toast.success('Customer updated successfully')
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(customerData)

        if (error) throw error
        toast.success('Customer added successfully')
      }

      onSave()
    } catch (error) {
      console.error('Error saving customer:', error)
      toast.error(error.message || 'Error saving customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? 'Update customer information' : 'Enter customer details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Customer Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Customer Type</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('customer_type')}
                  type="radio"
                  value="individual"
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">Individual</div>
                  <div className="text-xs text-gray-500">Walk-in customer</div>
                </div>
              </label>

              <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('customer_type')}
                  type="radio"
                  value="retailer"
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">Retailer</div>
                  <div className="text-xs text-gray-500">Business customer</div>
                </div>
              </label>

              <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('customer_type')}
                  type="radio"
                  value="wholesaler"
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">Wholesaler</div>
                  <div className="text-xs text-gray-500">Bulk buyer</div>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Enter customer name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input-field"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {customerType === 'individual' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient ID
                    </label>
                    <input
                      {...register('patient_id')}
                      type="text"
                      className="input-field"
                      placeholder="Enter patient ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      {...register('date_of_birth')}
                      type="date"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      {...register('gender')}
                      className="input-field"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      {...register('emergency_contact')}
                      type="tel"
                      className="input-field"
                      placeholder="Enter emergency contact"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="input-field"
                  placeholder="Enter address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input-field"
                  placeholder="Additional notes about the customer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn-primary"
            >
              {isSubmitting || loading
                ? (isEditing ? 'Updating...' : 'Adding...')
                : (isEditing ? 'Update Customer' : 'Add Customer')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerModal
