import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertCircle, Package } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const batchSchema = z.object({
  batch_number: z.string().min(1, 'Batch number is required'),
  manufacturing_date: z.string().optional(),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  supplier_purchase_price: z.number().min(0, 'Supplier purchase price must be positive'),
  purchase_price: z.number().min(0, 'Purchase price must be positive'),
  mrp: z.number().min(0, 'MRP must be positive'),
  selling_price: z.number().min(0, 'Selling price must be positive'),
  wholesale_price: z.number().min(0, 'Wholesale price must be positive'),
  gst_percentage: z.number().min(0).max(100),
  initial_quantity: z.number().min(1, 'Initial quantity must be at least 1'),
  free_quantity: z.number().min(0).default(0),
  rack_location: z.string().optional(),
  supplier_id: z.string().optional()
})

const BatchModal = ({ medicine, batch, onClose, onSave }) => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [existingInventory, setExistingInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const isEditing = !!batch

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: batch ? {
      ...batch,
      manufacturing_date: batch.manufacturing_date ? new Date(batch.manufacturing_date).toISOString().split('T')[0] : '',
      expiry_date: batch.expiry_date ? new Date(batch.expiry_date).toISOString().split('T')[0] : '',
      gst_percentage: batch.gst_percentage || medicine?.gst_percentage || 12,
      supplier_purchase_price: batch.supplier_purchase_price || batch.purchase_price
    } : {
      gst_percentage: medicine?.gst_percentage || 12,
      initial_quantity: 1,
      free_quantity: 0
    }
  })

  // Watch values for calculations
  const watchedValues = watch(['supplier_purchase_price', 'purchase_price', 'mrp', 'selling_price', 'wholesale_price'])

  useEffect(() => {
    fetchSuppliers()
    fetchExistingInventory()
  }, [])

  useEffect(() => {
    // Auto-calculate purchase price from supplier price (same value initially)
    const supplierPrice = watchedValues[0]
    if (supplierPrice && !isEditing) {
      setValue('purchase_price', supplierPrice)
    }
  }, [watchedValues[0], setValue, isEditing])

  useEffect(() => {
    // Auto-calculate selling price based on supplier purchase price (20% margin)
    const supplierPrice = watchedValues[0]
    if (supplierPrice && !isEditing) {
      const suggestedSellingPrice = supplierPrice * 1.2
      setValue('selling_price', parseFloat(suggestedSellingPrice.toFixed(2)))
    }
  }, [watchedValues[0], setValue, isEditing])

  useEffect(() => {
    // Auto-calculate wholesale price based on supplier purchase price (15% margin)
    const supplierPrice = watchedValues[0]
    if (supplierPrice && !isEditing) {
      const suggestedWholesalePrice = supplierPrice * 1.15
      setValue('wholesale_price', parseFloat(suggestedWholesalePrice.toFixed(2)))
    }
  }, [watchedValues[0], setValue, isEditing])

  const fetchExistingInventory = async () => {
    try {
      setInventoryLoading(true)
      const { data, error } = await supabase
        .from('medicine_batches')
        .select(`
          *,
          supplier:wholesalers(business_name, drug_license_number)
        `)
        .eq('medicine_id', medicine.id)
        .gt('current_quantity', 0)
        .order('expiry_date', { ascending: true })

      if (error) throw error
      setExistingInventory(data || [])
    } catch (error) {
      console.error('Error fetching existing inventory:', error)
    } finally {
      setInventoryLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('wholesalers')
        .select('id, business_name')
        .eq('status', 'active')
        .order('business_name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)

      // Validate expiry date is in future
      const expiryDate = new Date(data.expiry_date)
      if (expiryDate <= new Date()) {
        toast.error('Expiry date must be in the future')
        return
      }

      // Validate manufacturing date is before expiry date
      if (data.manufacturing_date) {
        const manufacturingDate = new Date(data.manufacturing_date)
        if (manufacturingDate >= expiryDate) {
          toast.error('Manufacturing date must be before expiry date')
          return
        }
      }

      // Validate pricing logic
      if (data.selling_price > data.mrp) {
        toast.error('Selling price cannot be greater than MRP')
        return
      }

      if (data.wholesale_price > data.selling_price) {
        toast.error('Wholesale price should typically be less than selling price')
      }

      const batchData = {
        ...data,
        medicine_id: medicine.id,
        current_quantity: isEditing ? batch.current_quantity : data.initial_quantity
      }

      if (isEditing) {
        const { error } = await supabase
          .from('medicine_batches')
          .update({
            ...batchData,
            updated_at: new Date().toISOString()
          })
          .eq('id', batch.id)

        if (error) throw error
        toast.success('Batch updated successfully')
      } else {
        // Check if batch number already exists for this medicine
        const { data: existing, error: checkError } = await supabase
          .from('medicine_batches')
          .select('id')
          .eq('medicine_id', medicine.id)
          .eq('batch_number', data.batch_number)
          .single()

        if (checkError && checkError.code !== 'PGRST116') throw checkError
        
        if (existing) {
          toast.error('Batch number already exists for this medicine')
          return
        }

        const { error } = await supabase
          .from('medicine_batches')
          .insert(batchData)

        if (error) throw error
        toast.success('Batch added successfully')
      }

      onSave()
    } catch (error) {
      console.error('Error saving batch:', error)
      toast.error(error.message || 'Error saving batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Batch' : 'Add New Batch'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {medicine?.name} - {medicine?.generic_name}
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
          {/* Existing Inventory Alert */}
          {!isEditing && existingInventory.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Existing Inventory for {medicine?.name}
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {inventoryLoading ? (
                  <p className="text-sm text-blue-700">Loading inventory...</p>
                ) : (
                  existingInventory.map((inv) => (
                    <div key={inv.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-blue-100">
                      <div>
                        <span className="font-medium text-gray-900">Batch: {inv.batch_number}</span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span className="text-gray-600">Qty: {inv.current_quantity}</span>
                        {inv.supplier && (
                          <>
                            <span className="text-gray-500 mx-2">•</span>
                            <span className="text-gray-600">{inv.supplier.business_name}</span>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900">₹{inv.supplier_purchase_price?.toFixed(2) || inv.purchase_price?.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          Exp: {inv.expiry_date ? new Date(inv.expiry_date).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Batch Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Batch Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number *
                </label>
                <input
                  {...register('batch_number')}
                  type="text"
                  className={`input-field ${errors.batch_number ? 'border-red-300' : ''}`}
                  placeholder="Enter batch number"
                />
                {errors.batch_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.batch_number.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  {...register('supplier_id')}
                  className="input-field"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.business_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturing Date
                </label>
                <input
                  {...register('manufacturing_date')}
                  type="date"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  {...register('expiry_date')}
                  type="date"
                  className={`input-field ${errors.expiry_date ? 'border-red-300' : ''}`}
                />
                {errors.expiry_date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.expiry_date.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rack Location
                </label>
                <input
                  {...register('rack_location')}
                  type="text"
                  className="input-field"
                  placeholder="e.g., A1, B2, Shelf-3"
                />
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Quantity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Quantity *
                </label>
                <input
                  {...register('initial_quantity', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className={`input-field ${errors.initial_quantity ? 'border-red-300' : ''}`}
                  placeholder="Enter initial quantity"
                />
                {errors.initial_quantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.initial_quantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Quantity
                </label>
                <input
                  {...register('free_quantity', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wholesaler Purchase Price * <span className="text-xs text-gray-500">(Price from this supplier)</span>
                </label>
                <input
                  {...register('supplier_purchase_price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input-field ${errors.supplier_purchase_price ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
                {errors.supplier_purchase_price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.supplier_purchase_price.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Purchase Price * <span className="text-xs text-gray-500">(For accounting)</span>
                </label>
                <input
                  {...register('purchase_price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input-field ${errors.purchase_price ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
                {errors.purchase_price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.purchase_price.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP *
                </label>
                <input
                  {...register('mrp', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input-field ${errors.mrp ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
                {errors.mrp && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.mrp.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price * <span className="text-xs text-gray-500">(Retail/Customer)</span>
                </label>
                <input
                  {...register('selling_price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input-field ${errors.selling_price ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
                {errors.selling_price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.selling_price.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wholesale Price *
                </label>
                <input
                  {...register('wholesale_price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input-field ${errors.wholesale_price ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
                {errors.wholesale_price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.wholesale_price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Rate (%)
              </label>
              <select
                {...register('gst_percentage', { valueAsNumber: true })}
                className="input-field"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Pricing Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Wholesaler Purchase:</span>
                <span className="font-medium ml-2">₹{(watchedValues[0] || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Standard Purchase:</span>
                <span className="font-medium ml-2">₹{(watchedValues[1] || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">MRP:</span>
                <span className="font-medium ml-2">₹{(watchedValues[2] || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Selling Price:</span>
                <span className="font-medium ml-2">₹{(watchedValues[3] || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Wholesale Price:</span>
                <span className="font-medium ml-2">₹{(watchedValues[4] || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Retail Margin:</span>
                <span className="font-medium ml-2">
                  {watchedValues[0] && watchedValues[3] 
                    ? `${(((watchedValues[3] - watchedValues[0]) / watchedValues[0]) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
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
                : (isEditing ? 'Update Batch' : 'Add Batch')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BatchModal