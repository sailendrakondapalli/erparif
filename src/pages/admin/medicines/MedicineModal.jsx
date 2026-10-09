import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  generic_name: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  composition: z.string().optional(),
  dosage_form: z.string().min(1, 'Dosage form is required'),
  strength: z.string().optional(),
  hsn_code: z.string().optional(),
  gst_percentage: z.number().min(0).max(100),
  prescription_required: z.boolean(),
  description: z.string().optional(),
  low_stock_threshold: z.number().min(0).default(10),
  // Initial batch/stock fields (optional)
  initial_batch_number: z.string().optional(),
  initial_quantity: z.number().min(0).optional(),
  initial_expiry_date: z.string().optional(),
  initial_mrp: z.number().min(0).optional(),
  initial_selling_price: z.number().min(0).optional(),
  initial_wholesale_price: z.number().min(0).optional(),
  initial_purchase_price: z.number().min(0).optional()
})

const MedicineModal = ({ medicine, onClose, onSave }) => {
  const isEditing = !!medicine

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(medicineSchema),
    defaultValues: medicine ? {
      ...medicine,
      gst_percentage: medicine.gst_percentage || 0,
      low_stock_threshold: medicine.low_stock_threshold || 10,
      prescription_required: medicine.prescription_required || false
    } : {
      gst_percentage: 12,
      low_stock_threshold: 10,
      prescription_required: false
    }
  })

  const categories = [
    'Antibiotics',
    'Pain Relief',
    'Diabetes',
    'Vitamins',
    'Cardiovascular',
    'Respiratory',
    'Gastrointestinal',
    'Dermatology',
    'Others'
  ]

  const dosageForms = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Ointment',
    'Cream',
    'Drops',
    'Inhaler',
    'Powder',
    'Others'
  ]

  const gstRates = [0, 5, 12, 18, 28]

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('medicines')
          .update({
            name: data.name,
            generic_name: data.generic_name,
            brand: data.brand,
            manufacturer: data.manufacturer,
            category: data.category,
            composition: data.composition,
            dosage_form: data.dosage_form,
            strength: data.strength,
            hsn_code: data.hsn_code,
            gst_percentage: data.gst_percentage,
            prescription_required: data.prescription_required,
            description: data.description,
            low_stock_threshold: data.low_stock_threshold,
            updated_at: new Date().toISOString()
          })
          .eq('id', medicine.id)

        if (error) throw error
        toast.success('Medicine updated successfully')
      } else {
        // Check if medicine already exists
        const { data: existing, error: checkError } = await supabase
          .from('medicines')
          .select('id')
          .eq('name', data.name)
          .eq('status', 'active')
          .single()

        if (checkError && checkError.code !== 'PGRST116') throw checkError
        
        if (existing) {
          toast.error('Medicine with this name already exists')
          return
        }

        // Insert medicine
        const medicineData = {
          name: data.name,
          generic_name: data.generic_name,
          brand: data.brand,
          manufacturer: data.manufacturer,
          category: data.category,
          composition: data.composition,
          dosage_form: data.dosage_form,
          strength: data.strength,
          hsn_code: data.hsn_code,
          gst_percentage: data.gst_percentage,
          prescription_required: data.prescription_required,
          description: data.description,
          low_stock_threshold: data.low_stock_threshold
        }

        const { data: newMedicine, error: medicineError } = await supabase
          .from('medicines')
          .insert(medicineData)
          .select()
          .single()

        if (medicineError) throw medicineError

        // Create initial batch if stock data provided
        if (data.initial_quantity && data.initial_quantity > 0) {
          const batchData = {
            medicine_id: newMedicine.id,
            batch_number: data.initial_batch_number || `BATCH-${Date.now()}`,
            quantity: data.initial_quantity,
            current_quantity: data.initial_quantity,
            expiry_date: data.initial_expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            mrp: data.initial_mrp || 0,
            selling_price: data.initial_selling_price || 0,
            wholesale_price: data.initial_wholesale_price || 0,
            supplier_purchase_price: data.initial_purchase_price || 0
          }

          const { error: batchError } = await supabase
            .from('medicine_batches')
            .insert(batchData)

          if (batchError) {
            console.error('Error creating initial batch:', batchError)
            toast.warning('Medicine added but failed to create initial batch')
          } else {
            toast.success('Medicine and initial stock added successfully')
          }
        } else {
          toast.success('Medicine added successfully')
        }
      }

      onSave()
    } catch (error) {
      console.error('Error saving medicine:', error)
      toast.error(error.message || 'Error saving medicine')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
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
                  Medicine Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Enter medicine name"
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
                  Generic Name
                </label>
                <input
                  {...register('generic_name')}
                  type="text"
                  className="input-field"
                  placeholder="Enter generic name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  {...register('brand')}
                  type="text"
                  className="input-field"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer
                </label>
                <input
                  {...register('manufacturer')}
                  type="text"
                  className="input-field"
                  placeholder="Enter manufacturer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className={`input-field ${errors.category ? 'border-red-300' : ''}`}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage Form *
                </label>
                <select
                  {...register('dosage_form')}
                  className={`input-field ${errors.dosage_form ? 'border-red-300' : ''}`}
                >
                  <option value="">Select dosage form</option>
                  {dosageForms.map(form => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </select>
                {errors.dosage_form && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.dosage_form.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strength
                </label>
                <input
                  {...register('strength')}
                  type="text"
                  className="input-field"
                  placeholder="e.g., 500mg, 10ml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HSN Code
                </label>
                <input
                  {...register('hsn_code')}
                  type="text"
                  className="input-field"
                  placeholder="Enter HSN code"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Composition
              </label>
              <textarea
                {...register('composition')}
                rows={2}
                className="input-field"
                placeholder="Enter medicine composition"
              />
            </div>
          </div>

          {/* Tax & Regulatory */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tax & Regulatory</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Rate (%)
                </label>
                <select
                  {...register('gst_percentage', { valueAsNumber: true })}
                  className="input-field"
                >
                  {gstRates.map(rate => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  {...register('low_stock_threshold', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="10"
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  {...register('prescription_required')}
                  type="checkbox"
                  id="prescription_required"
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="prescription_required" className="text-sm text-gray-700">
                  Prescription Required
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input-field"
              placeholder="Enter medicine description, indications, etc."
            />
          </div>

          {/* Initial Stock (only for new medicine) */}
          {!isEditing && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Initial Stock (Optional)</h3>
                <p className="text-sm text-gray-500">Add opening stock for this medicine</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    {...register('initial_batch_number')}
                    type="text"
                    className="input-field"
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Quantity
                  </label>
                  <input
                    {...register('initial_quantity', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    {...register('initial_expiry_date')}
                    type="date"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MRP (₹)
                  </label>
                  <input
                    {...register('initial_mrp', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (₹)
                  </label>
                  <input
                    {...register('initial_selling_price', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wholesale Price (₹)
                  </label>
                  <input
                    {...register('initial_wholesale_price', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price (₹)
                  </label>
                  <input
                    {...register('initial_purchase_price', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can skip this section and add stock later using the "Add Batch" button on the medicines page.
                </p>
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Adding...')
                : (isEditing ? 'Update Medicine' : 'Add Medicine')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MedicineModal