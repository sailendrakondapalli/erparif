import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const wholesalerSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  drug_license_number: z.string().min(1, 'Drug License Number is required'),
  drug_license_expiry: z.string().min(1, 'Drug License Expiry is required'),
  pan: z.string().optional(),
  credit_limit: z.number().min(0).default(0),
  payment_terms: z.number().min(0).default(30),
  status: z.enum(['active', 'inactive']).default('active')
})

const WholesalerModal = ({ wholesaler, onClose, onSave }) => {
  const [loading, setLoading] = useState(false)
  const isEditing = !!wholesaler

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    resolver: zodResolver(wholesalerSchema),
    defaultValues: wholesaler ? {
      ...wholesaler,
      drug_license_expiry: wholesaler.drug_license_expiry 
        ? new Date(wholesaler.drug_license_expiry).toISOString().split('T')[0] 
        : ''
    } : {
      status: 'active',
      credit_limit: 0,
      payment_terms: 30
    }
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)

      // Validate drug license expiry is in future
      const expiryDate = new Date(data.drug_license_expiry)
      if (expiryDate <= new Date()) {
        toast.error('Drug License expiry date must be in the future')
        return
      }

      // Clean up empty optional fields
      const wholesalerData = {
        ...data,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        gstin: data.gstin || null,
        pan: data.pan || null
      }

      if (isEditing) {
        const { error } = await supabase
          .from('wholesalers')
          .update({
            ...wholesalerData,
            updated_at: new Date().toISOString()
          })
          .eq('id', wholesaler.id)

        if (error) throw error
        toast.success('Wholesaler updated successfully')
      } else {
        const { error } = await supabase
          .from('wholesalers')
          .insert(wholesalerData)

        if (error) throw error
        toast.success('Wholesaler added successfully')
      }

      onSave()
    } catch (error) {
      console.error('Error saving wholesaler:', error)
      toast.error(error.message || 'Error saving wholesaler')
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
              {isEditing ? 'Edit Wholesaler' : 'Add New Wholesaler'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? 'Update wholesaler information' : 'Enter wholesaler details'}
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  {...register('business_name')}
                  type="text"
                  className={`input-field ${errors.business_name ? 'border-red-300' : ''}`}
                  placeholder="Enter business name"
                />
                {errors.business_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <input
                  {...register('owner_name')}
                  type="text"
                  className={`input-field ${errors.owner_name ? 'border-red-300' : ''}`}
                  placeholder="Enter owner name"
                />
                {errors.owner_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phone.message}
                  </p>
                )}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="input-field"
                  placeholder="Enter business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  {...register('city')}
                  type="text"
                  className="input-field"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  {...register('state')}
                  type="text"
                  className="input-field"
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode
                </label>
                <input
                  {...register('pincode')}
                  type="text"
                  className="input-field"
                  placeholder="Enter pincode"
                />
              </div>
            </div>
          </div>

          {/* License & Tax Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">License & Tax Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drug License Number * <span className="text-xs text-red-600">(Mandatory)</span>
                </label>
                <input
                  {...register('drug_license_number')}
                  type="text"
                  className={`input-field ${errors.drug_license_number ? 'border-red-300' : ''}`}
                  placeholder="Enter drug license number"
                />
                {errors.drug_license_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.drug_license_number.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drug License Expiry *
                </label>
                <input
                  {...register('drug_license_expiry')}
                  type="date"
                  className={`input-field ${errors.drug_license_expiry ? 'border-red-300' : ''}`}
                />
                {errors.drug_license_expiry && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.drug_license_expiry.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GSTIN <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  {...register('gstin')}
                  type="text"
                  className="input-field"
                  placeholder="Enter GSTIN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN
                </label>
                <input
                  {...register('pan')}
                  type="text"
                  className="input-field"
                  placeholder="Enter PAN number"
                />
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Payment Terms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Limit (₹)
                </label>
                <input
                  {...register('credit_limit', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms (Days)
                </label>
                <input
                  {...register('payment_terms', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="30"
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
                : (isEditing ? 'Update Wholesaler' : 'Add Wholesaler')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WholesalerModal
