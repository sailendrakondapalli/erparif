import React, { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, Printer, Download, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import useCartStore from '../../../store/cartStore'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const POSPage = () => {
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [customers, setCustomers] = useState([])
  const [wholesalers, setWholesalers] = useState([])
  const [retailers, setRetailers] = useState([])
  const [lastSale, setLastSale] = useState(null)

  const {
    items,
    customer,
    saleType,
    paymentMethod,
    discount,
    addItem,
    updateItemQuantity,
    removeItem,
    setCustomer,
    setSaleType,
    setPaymentMethod,
    setDiscount,
    getSubtotal,
    getGST,
    getGrandTotal,
    getItemsCount,
    clearCart,
    validateCart
  } = useCartStore()

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    fetchCustomersAndWholesalers()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchMedicines()
    } else {
      setMedicines([])
    }
  }, [searchTerm])

  // Auto-open customer modal when sale type changes
  useEffect(() => {
    if (!customer) {
      setShowCustomerModal(true)
    }
  }, [saleType])

  const fetchCustomersAndWholesalers = async () => {
    try {
      // Fetch customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (customerError) throw customerError
      setCustomers(customerData || [])

      // Fetch wholesalers
      const { data: wholesalerData, error: wholesalerError } = await supabase
        .from('wholesalers')
        .select('*')
        .eq('status', 'active')
        .order('business_name')

      if (wholesalerError) throw wholesalerError
      setWholesalers(wholesalerData || [])

      // Fetch retailers
      const { data: retailerData, error: retailerError } = await supabase
        .from('retailers')
        .select('*')
        .eq('status', 'active')
        .order('business_name')

      if (retailerError) throw retailerError
      setRetailers(retailerData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const searchMedicines = async () => {
    setLoading(true)
    try {
      // First get medicines
      const { data: medicineData, error: medError } = await supabase
        .from('medicines')
        .select('*')
        .eq('status', 'active')
        .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`)
        .limit(10)

      if (medError) throw medError

      if (!medicineData || medicineData.length === 0) {
        setMedicines([])
        return
      }

      // Then get batches for these medicines
      const medicineIds = medicineData.map(m => m.id)
      const { data: batchData, error: batchError } = await supabase
        .from('medicine_batches')
        .select('*')
        .in('medicine_id', medicineIds)
        .gt('current_quantity', 0)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      if (batchError) throw batchError

      // Combine data
      const medicinesWithBatches = medicineData.map(medicine => ({
        ...medicine,
        medicine_batches: batchData?.filter(b => b.medicine_id === medicine.id) || []
      })).filter(m => m.medicine_batches.length > 0)

      setMedicines(medicinesWithBatches)
    } catch (error) {
      console.error('Error searching medicines:', error)
      toast.error('Error searching medicines')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (medicine, batch, quantity = 1, freeQuantity = 0) => {
    // Validate quantity
    if (quantity + freeQuantity > batch.current_quantity) {
      toast.error('Insufficient stock available')
      return
    }

    // Check expiry
    if (new Date(batch.expiry_date) <= new Date()) {
      toast.error('This batch has expired')
      return
    }

    addItem(medicine, batch, quantity, freeQuantity)
    toast.success(`${medicine.name} added to cart`)
  }

  const handleProcessSale = async (paymentData) => {
    try {
      const errors = validateCart()
      if (errors.length > 0) {
        toast.error(errors[0])
        return
      }

      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Generate invoice number
      const { data: invoiceData, error: invoiceError } = await supabase
        .rpc('generate_invoice_number')

      if (invoiceError) throw invoiceError

      // Prepare sale data
      const saleData = {
        invoice_number: invoiceData,
        customer_id: customer?.type === 'customer' ? customer.id : null,
        retailer_id: customer?.type === 'retailer' ? customer.id : null,
        wholesaler_id: customer?.type === 'wholesaler' ? customer.id : null,
        subtotal: getSubtotal(),
        discount: discount,
        gst_amount: getGST(),
        total: getGrandTotal(),
        paid_amount: parseFloat(paymentData.paidAmount) || 0,
        due_amount: getGrandTotal() - (parseFloat(paymentData.paidAmount) || 0),
        payment_method: paymentMethod,
        payment_status: (parseFloat(paymentData.paidAmount) || 0) >= getGrandTotal() ? 'paid' : 'partial',
        sale_type: saleType,
        prescription_reference: paymentData.prescriptionRef || null,
        created_by: user?.id
      }

      // Prepare sale items
      const saleItems = items.map(item => ({
        medicine_id: item.medicine.id,
        batch_id: item.batch.id,
        quantity: item.quantity,
        free_quantity: item.freeQuantity || 0,
        selling_price: item.price,
        discount: item.discount || 0,
        gst_percentage: item.medicine.gst_percentage || 0,
        gst_amount: (item.quantity * item.price * (item.medicine.gst_percentage || 0)) / 100,
        total: item.quantity * item.price * (1 + (item.medicine.gst_percentage || 0) / 100)
      }))

      // Create sale with items
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single()

      if (saleError) throw saleError

      // Add sale items
      const itemsWithSaleId = saleItems.map(item => ({
        ...item,
        sale_id: sale.id
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId)

      if (itemsError) throw itemsError

      // Create payment record if paid
      if (parseFloat(paymentData.paidAmount) > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            sale_id: sale.id,
            customer_id: customer?.type === 'customer' ? customer.id : null,
            amount: parseFloat(paymentData.paidAmount),
            payment_method: paymentMethod,
            reference_number: paymentData.referenceNumber || paymentData.razorpay_payment_id || null,
            created_by: user?.id
          })

        if (paymentError) throw paymentError
      }

      // Save last sale for download
      setLastSale({ ...sale, items: itemsWithSaleId })

      // Clear cart and show success
      clearCart()
      setShowPaymentModal(false)
      setShowPaymentMethodModal(false)
      toast.success('Sale completed successfully!')

      // Auto download bill
      setTimeout(() => {
        downloadBill({ ...sale, items: itemsWithSaleId })
      }, 500)

    } catch (error) {
      console.error('Error processing sale:', error)
      toast.error('Error processing sale: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpayPayment = () => {
    const amount = getGrandTotal()
    
    // Check if Razorpay script is loaded
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Razorpay not loaded. Please refresh the page.')
      return
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      name: 'BillSprout Medicals',
      description: `Sale - Invoice ${Date.now()}`,
      image: '/logo.png',
      handler: function (response) {
        // Payment successful
        const paymentData = {
          paidAmount: amount,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          referenceNumber: response.razorpay_payment_id,
          prescriptionRef: ''
        }
        
        setPaymentMethod('razorpay')
        handleProcessSale(paymentData)
      },
      prefill: {
        name: customer?.name || customer?.business_name || '',
        contact: customer?.phone || '',
        email: customer?.email || ''
      },
      notes: {
        sale_type: saleType,
        customer_type: customer?.type || 'walk-in'
      },
      theme: {
        color: '#3b82f6'
      },
      modal: {
        ondismiss: function() {
          setLoading(false)
          toast.info('Payment cancelled')
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', function (response){
      setLoading(false)
      toast.error('Payment failed: ' + response.error.description)
    })
    
    rzp.open()
  }

  const downloadBill = async (sale) => {
    try {
      // Load logo and convert to base64
      let logoBase64 = ''
      try {
        const response = await fetch('/logo.png')
        const blob = await response.blob()
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
      } catch (error) {
        console.warn('Could not load logo, using placeholder')
      }

      // Create bill content with embedded logo
      const billContent = generateBillHTML(sale, logoBase64)
      
      // Create blob and download
      const blob = new Blob([billContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${sale.invoice_number}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Bill downloaded successfully!')
    } catch (error) {
      console.error('Error downloading bill:', error)
      toast.error('Error downloading bill')
    }
  }

  const generateBillHTML = (sale, logoBase64 = '') => {
    const isWholesale = sale.sale_type === 'wholesale'
    const currentDate = new Date(sale.created_at)
    const dateStr = currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = currentDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    
    // Use base64 logo if available, otherwise fallback to path
    const logoSrc = logoBase64 || '/logo.png'
    
    // Calculate GST breakdown by rate
    const gstBreakdown = {}
    sale.items.forEach((item, index) => {
      const medicine = items[index]?.medicine
      const gstRate = medicine?.gst_percentage || 0
      if (!gstBreakdown[gstRate]) {
        gstBreakdown[gstRate] = { value: 0, gstAmt: 0 }
      }
      const itemSubtotal = item.quantity * item.selling_price
      gstBreakdown[gstRate].value += itemSubtotal
      gstBreakdown[gstRate].gstAmt += item.gst_amount
    })

    // Calculate totals for summary
    const grossTotal = sale.subtotal
    const totalDiscount = sale.discount
    const taxableAmount = grossTotal - totalDiscount
    const totalTaxAmount = sale.gst_amount
    const roundOff = sale.total - (taxableAmount + totalTaxAmount)
    const netAmount = sale.total

    // Amount in words
    const amountInWords = numberToWords(Math.round(netAmount))

    // Generate items HTML
    const itemsHTML = sale.items.map((item, index) => {
      const medicine = items[index]?.medicine
      const batch = items[index]?.batch
      const gstRate = medicine?.gst_percentage || 0
      const itemSubtotal = item.quantity * item.selling_price
      const discountAmt = item.discount || 0
      const gstAmt = item.gst_amount
      
      return `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #000;">
            <strong>${medicine?.name || 'Medicine'}</strong>
            ${medicine?.generic_name ? `<br><span style="font-size: 11px; color: #666;">${medicine.generic_name}</span>` : ''}
          </td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${medicine?.dosage_form || '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${medicine?.hsn_code || '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${batch?.batch_number || '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${batch?.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${item.quantity}</td>
          ${item.free_quantity ? `<td style="text-align: center; padding: 8px; border: 1px solid #000;">${item.free_quantity}</td>` : ''}
          ${isWholesale ? `<td style="text-align: right; padding: 8px; border: 1px solid #000;">${batch?.mrp?.toFixed(2) || '0.00'}</td>` : ''}
          <td style="text-align: right; padding: 8px; border: 1px solid #000;">${item.selling_price.toFixed(2)}</td>
          ${isWholesale ? `<td style="text-align: center; padding: 8px; border: 1px solid #000;">${discountAmt.toFixed(2)}%</td>` : ''}
          ${isWholesale ? `<td style="text-align: right; padding: 8px; border: 1px solid #000;">${itemSubtotal.toFixed(2)}</td>` : ''}
          ${isWholesale ? `<td style="text-align: center; padding: 8px; border: 1px solid #000;">${gstRate.toFixed(2)}%</td>` : ''}
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${gstRate.toFixed(2)}%</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #000;"><strong>${item.total.toFixed(2)}</strong></td>
        </tr>
      `
    }).join('')

    // GST breakdown HTML
    const gstBreakdownHTML = Object.entries(gstBreakdown).sort(([a], [b]) => a - b).map(([rate, data]) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 4px;"><strong>${rate}%</strong></td>
        <td style="padding: 4px; text-align: right;">${data.value.toFixed(2)}</td>
        <td style="padding: 4px; text-align: right;">${data.gstAmt.toFixed(2)}</td>
        <td style="padding: 4px; text-align: right;">0.00</td>
        <td style="padding: 4px; text-align: right;">0.00</td>
        <td style="padding: 4px; text-align: right;">0.00</td>
      </tr>
    `).join('')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isWholesale ? 'Tax Invoice - Wholesale' : 'Retail Bill'} - ${sale.invoice_number}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px; 
      line-height: 1.4;
      padding: 15px;
    }
    .invoice-container { border: 2px solid #000; padding: 0; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 15px; 
      border-bottom: 2px solid #000; 
    }
    .logo-section { display: flex; align-items: center; gap: 15px; }
    .logo { width: 80px; height: 80px; }
    .company-info h1 { font-size: 18px; margin-bottom: 5px; color: #c41e3a; }
    .company-info h2 { font-size: 14px; margin-bottom: 3px; font-weight: normal; }
    .company-info p { font-size: 10px; margin: 2px 0; color: #333; }
    .invoice-type { 
      border: 2px solid #000; 
      padding: 8px 15px; 
      text-align: center; 
      font-weight: bold; 
    }
    .invoice-type-title { font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
    .invoice-type-subtitle { font-size: 10px; }
    .customer-section { 
      display: flex; 
      padding: 10px 15px; 
      border-bottom: 2px solid #000; 
    }
    .customer-details { flex: 1; }
    .invoice-details { flex: 1; text-align: right; }
    .customer-details p, .invoice-details p { margin: 3px 0; }
    .customer-details strong { display: inline-block; width: 120px; }
    .invoice-details strong { display: inline-block; width: 100px; text-align: left; }
    table { width: 100%; border-collapse: collapse; }
    .items-table th { 
      background-color: #f0f0f0; 
      padding: 8px 4px; 
      border: 1px solid #000; 
      font-size: 10px;
      text-align: center;
    }
    .items-table td { font-size: 11px; }
    .totals-section { 
      display: flex; 
      border-top: 2px solid #000; 
    }
    .gst-breakdown { 
      flex: 1; 
      padding: 10px; 
      border-right: 2px solid #000; 
    }
    .gst-breakdown table { font-size: 10px; }
    .gst-breakdown th { text-align: left; padding: 4px; border-bottom: 1px solid #000; }
    .totals-summary { 
      width: 300px; 
      padding: 10px; 
    }
    .totals-summary table { width: 100%; font-size: 11px; }
    .totals-summary td { padding: 4px 8px; }
    .totals-summary .net-amount { 
      font-size: 16px; 
      font-weight: bold; 
      border-top: 2px solid #000; 
      padding-top: 8px !important; 
    }
    .amount-words { 
      padding: 8px 15px; 
      border-top: 2px solid #000; 
      border-bottom: 2px solid #000; 
      background-color: #f9f9f9; 
    }
    .footer { 
      display: flex; 
      padding: 15px; 
    }
    .terms { flex: 1; }
    .terms h4 { margin-bottom: 8px; }
    .terms ol { margin-left: 20px; font-size: 10px; }
    .terms li { margin: 4px 0; }
    .signature { 
      width: 200px; 
      text-align: center; 
      border-left: 1px solid #000; 
      padding-left: 15px; 
    }
    .get-well { 
      color: #c41e3a; 
      font-weight: bold; 
      font-size: 14px; 
      margin: 10px 0; 
    }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo">
          <img src="${logoSrc}" alt="BillSprout Logo" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div class="company-info">
          <h1>BillSprout Medicals</h1>
          <h2>and Pharmaceutical Distributors</h2>
          <p><strong>Main Road, Vizianagaram, Andhra Pradesh - 535001</strong></p>
          <p><strong>Phone:</strong> 92423 45678 | <strong>GSTIN:</strong> 37ABCDE1234F1Z5</p>
          <p><strong>Email:</strong> info@billsprout.online | <strong>www.billsprout.online</strong></p>
        </div>
      </div>
      <div class="invoice-type">
        <div class="invoice-type-title">${isWholesale ? 'TAX INVOICE' : 'RETAIL BILL'}</div>
        <div class="invoice-type-subtitle">${isWholesale ? 'WHOLESALE' : 'CASH / CARD / UPI'}</div>
        <div class="invoice-type-subtitle">${isWholesale ? '(Original for Recipient)' : '(Original for Patient)'}</div>
      </div>
    </div>

    <!-- Customer & Invoice Details -->
    <div class="customer-section">
      <div class="customer-details">
        ${isWholesale && customer ? `
          <p><strong>To :</strong> ${customer.business_name || customer.name}</p>
          ${customer.address ? `<p><strong></strong> ${customer.address}</p>` : ''}
          ${customer.phone ? `<p><strong>PH:</strong> ${customer.phone}</p>` : ''}
          ${customer.gstin ? `<p><strong>GSTIN:</strong> ${customer.gstin}</p>` : ''}
          ${customer.drug_license_number ? `<p><strong>DL No:</strong> ${customer.drug_license_number}</p>` : ''}
        ` : `
          <p><strong>Patient Mobile :</strong> ${customer?.phone || '9876543210'}</p>
          <p><strong>Doctor Name :</strong> DR</p>
        `}
      </div>
      <div class="invoice-details">
        <p><strong>Invoice No.</strong> : ${sale.invoice_number}</p>
        <p><strong>Date</strong> : ${dateStr}</p>
        <p><strong>Time</strong> : ${timeStr}</p>
        ${isWholesale ? `
          <p><strong>Due Date</strong> : ${dateStr}</p>
          <p><strong>Place of Supply</strong> : Vizianagaram (36)</p>
          <p><strong>Terms</strong> : ${sale.payment_method === 'credit' ? 'Credit' : 'Cash'}</p>
        ` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 30px;">Sr No</th>
          <th style="width: ${isWholesale ? '200px' : '250px'};">${isWholesale ? 'Product Name' : 'Item Descriptions'}</th>
          <th style="width: 50px;">Pack</th>
          <th style="width: 60px;">HSN Code</th>
          <th style="width: 70px;">Batch</th>
          <th style="width: 50px;">Exp</th>
          <th style="width: 40px;">Qty</th>
          ${isWholesale ? '<th style="width: 40px;">Free</th>' : ''}
          ${isWholesale ? '<th style="width: 60px;">M.R.P</th>' : ''}
          <th style="width: 60px;">RATE</th>
          ${isWholesale ? '<th style="width: 50px;">Dis%</th>' : ''}
          ${isWholesale ? '<th style="width: 70px;">Dis Amt</th>' : ''}
          ${isWholesale ? '<th style="width: 50px;">Amount</th>' : ''}
          <th style="width: 50px;">GST%</th>
          ${isWholesale ? '<th style="width: 70px;">GST Amt</th>' : ''}
          <th style="width: 80px;">Total Amt</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-section">
      <div class="gst-breakdown">
        <table>
          <thead>
            <tr>
              <th>GST%</th>
              <th style="text-align: right;">VALUE</th>
              <th style="text-align: right;">GST AMT</th>
              <th style="text-align: right;">SGST%</th>
              <th style="text-align: right;">VALUE</th>
              <th style="text-align: right;">SGST AMT</th>
            </tr>
          </thead>
          <tbody>
            ${gstBreakdownHTML}
          </tbody>
        </table>
      </div>
      <div class="totals-summary">
        <table>
          <tr>
            <td><strong>${isWholesale ? 'No. of Items:' : 'CGST :'}</strong></td>
            <td style="text-align: right;">${isWholesale ? sale.items.length : (totalTaxAmount / 2).toFixed(2)}</td>
            <td style="text-align: right;"><strong>Gross Total</strong></td>
            <td style="text-align: right;">${grossTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>${isWholesale ? 'Subtotal:' : 'SGST :'}</strong></td>
            <td style="text-align: right;">${isWholesale ? grossTotal.toFixed(2) : (totalTaxAmount / 2).toFixed(2)}</td>
            <td style="text-align: right;"><strong>Total Discount</strong></td>
            <td style="text-align: right;">${totalDiscount.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>${isWholesale ? '(-)Less:' : 'IGST :'}</strong></td>
            <td style="text-align: right;">${isWholesale ? totalDiscount.toFixed(2) : '0.00'}</td>
            <td style="text-align: right;"><strong>Taxable Amount</strong></td>
            <td style="text-align: right;">${taxableAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>${isWholesale ? '(+-)Adjustment:' : ''}</strong></td>
            <td style="text-align: right;">${isWholesale ? '0.00' : ''}</td>
            <td style="text-align: right;"><strong>Total Tax Amount</strong></td>
            <td style="text-align: right;">${totalTaxAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>${isWholesale ? 'CR Amt:' : ''}</strong></td>
            <td style="text-align: right;">${isWholesale ? '0.00' : ''}</td>
            <td style="text-align: right;"><strong>Round Off</strong></td>
            <td style="text-align: right;">${roundOff.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>${isWholesale ? 'Total:' : ''}</strong></td>
            <td style="text-align: right;">${isWholesale ? netAmount.toFixed(2) : ''}</td>
            <td style="text-align: right;" class="net-amount">Net Amount</td>
            <td style="text-align: right;" class="net-amount">${netAmount.toFixed(2)}</td>
          </tr>
          ${isWholesale ? `
          <tr>
            <td colspan="2"><strong>Round Off:</strong></td>
            <td style="text-align: right;" colspan="2">${roundOff.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" class="net-amount">Net Payable:</td>
            <td style="text-align: right;" class="net-amount" colspan="2">${Math.round(netAmount).toFixed(2)}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="amount-words">
      <strong>Amount in Words :</strong> Rs. ${amountInWords}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="terms">
        <h4>Terms and Conditions :</h4>
        ${isWholesale ? `
          <ol>
            <li>Goods supplied in this invoice do not contravene section 10 of the Drugs & Cosmetics Act-1940.</li>
            <li>Subject to Vizianagaram Jurisdiction Only.</li>
            <li>Interest @ 24% p.a. will be charged on overdue payments.</li>
            <li>Goods once sold will not be taken back.</li>
          </ol>
        ` : `
          <p class="get-well">**GET WELL SOON**</p>
          <p style="font-size: 10px; color: #666; margin-top: 8px;">
            Get well soon. Scan the Healthcare QR Code for complete health services, insurance, and government benefits.
          </p>
        `}
      </div>
      <div class="signature">
        <p style="margin-bottom: 60px;">For, BillSprout<br>${isWholesale ? 'Medicals and Pharmaceutical Distributors' : ''}</p>
        <p style="border-top: 1px solid #000; padding-top: 5px;">Authorised Sign.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  }

  // Helper function to convert number to words
  const numberToWords = (num) => {
    if (num === 0) return 'Zero'
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    const convertTens = (n) => {
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    }
    
    const convertHundreds = (n) => {
      if (n < 100) return convertTens(n)
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertTens(n % 100) : '')
    }
    
    if (num < 1000) return convertHundreds(num) + ' only'
    if (num < 100000) {
      return convertTens(Math.floor(num / 1000)) + ' Thousand' + 
             (num % 1000 ? ' ' + convertHundreds(num % 1000) : '') + ' only'
    }
    if (num < 10000000) {
      return convertHundreds(Math.floor(num / 100000)) + ' Lakh' + 
             (num % 100000 ? ' ' + (Math.floor((num % 100000) / 1000) ? convertTens(Math.floor((num % 100000) / 1000)) + ' Thousand' : '') + 
             (num % 1000 ? ' ' + convertHundreds(num % 1000) : '') : '') + ' only'
    }
    return 'Amount too large'
  }

  const MedicineSearchResults = () => (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {medicines.map(medicine => (
        medicine.medicine_batches.map(batch => (
          <div key={`${medicine.id}-${batch.id}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{medicine.name}</h4>
              <p className="text-sm text-gray-500">{medicine.generic_name}</p>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-400">Batch: {batch.batch_number}</span>
                <span className="text-xs text-gray-400">Exp: {new Date(batch.expiry_date).toLocaleDateString()}</span>
                <span className="text-xs text-gray-400">Stock: {batch.current_quantity}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  ₹{saleType === 'retail' ? batch.selling_price : batch.wholesale_price}
                </p>
                <p className="text-xs text-gray-500">MRP: ₹{batch.mrp}</p>
              </div>
              <button
                onClick={() => handleAddToCart(medicine, batch)}
                className="btn-primary px-3 py-1 text-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      ))}
    </div>
  )

  const CartItems = () => (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{item.medicine.name}</h4>
            <p className="text-sm text-gray-500">Batch: {item.batch.batch_number}</p>
            <p className="text-sm text-gray-500">₹{item.price} × {item.quantity} {item.freeQuantity > 0 && `+ ${item.freeQuantity} free`}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1), item.freeQuantity)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => updateItemQuantity(item.id, item.quantity + 1, item.freeQuantity)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1 text-red-400 hover:text-red-600 ml-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Process Payment</h3>
        <form onSubmit={handleSubmit(handleProcessSale)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <div className="text-2xl font-bold text-primary-600">
                ₹{getGrandTotal().toFixed(2)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
                <option value="razorpay">Razorpay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid Amount
              </label>
              <input
                {...register('paidAmount', { required: true, min: 0 })}
                type="number"
                step="0.01"
                defaultValue={getGrandTotal()}
                className="input-field"
              />
            </div>

            {paymentMethod !== 'cash' && paymentMethod !== 'razorpay' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  {...register('referenceNumber')}
                  type="text"
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Reference (Optional)
              </label>
              <input
                {...register('prescriptionRef')}
                type="text"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const PaymentMethodModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        
        <div className="space-y-3">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-primary-600">
              ₹{getGrandTotal().toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Total Amount</p>
          </div>

          {/* Cash Payment */}
          <button
            onClick={() => {
              setSelectedPaymentMethod('cash')
              setPaymentMethod('cash')
              setShowPaymentMethodModal(false)
              setShowPaymentModal(true)
            }}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Cash Payment</div>
                <div className="text-sm text-gray-500">Pay with cash</div>
              </div>
            </div>
          </button>

          {/* Razorpay Payment */}
          <button
            onClick={() => {
              setSelectedPaymentMethod('razorpay')
              setPaymentMethod('razorpay')
              setShowPaymentMethodModal(false)
              setLoading(true)
              handleRazorpayPayment()
            }}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Razorpay</div>
                <div className="text-sm text-gray-500">UPI, Card, Net Banking & More</div>
              </div>
            </div>
          </button>

          {/* Other Methods */}
          <button
            onClick={() => {
              setSelectedPaymentMethod('other')
              setPaymentMethod('upi')
              setShowPaymentMethodModal(false)
              setShowPaymentModal(true)
            }}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Other Methods</div>
                <div className="text-sm text-gray-500">UPI, Card, Bank Transfer, Credit</div>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={() => setShowPaymentMethodModal(false)}
          className="w-full mt-4 btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  const CustomerSelectionModal = () => {
    const [searchCustomer, setSearchCustomer] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [addingNew, setAddingNew] = useState(false)

    // Filter based on sale type
    const isRetailMode = saleType === 'retail'
    
    const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      (c.phone && c.phone.includes(searchCustomer))
    )

    const filteredWholesalers = wholesalers.filter(w =>
      w.business_name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      w.phone.includes(searchCustomer) ||
      w.drug_license_number.toLowerCase().includes(searchCustomer.toLowerCase())
    )

    const handleSelectCustomer = (selectedCustomer, type) => {
      setCustomer({ ...selectedCustomer, type })
      setShowCustomerModal(false)
      toast.success(`${type === 'wholesaler' ? 'Wholesaler' : 'Customer'} selected`)
    }

    const handleQuickAdd = async (e) => {
      e.preventDefault()
      setAddingNew(true)
      
      try {
        const formData = new FormData(e.target)
        
        if (isRetailMode) {
          // Quick add customer
          const customerData = {
            name: formData.get('name'),
            phone: formData.get('phone') || null,
            email: formData.get('email') || null,
            patient_id: formData.get('patient_id') || null,
            date_of_birth: formData.get('date_of_birth') || null,
            gender: formData.get('gender') || null,
            emergency_contact: formData.get('emergency_contact') || null,
            address: formData.get('address') || null,
            notes: formData.get('notes') || null,
            customer_type: 'individual',
            status: 'active'
          }
          
          const { data, error } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single()
          
          if (error) throw error
          
          setCustomers([...customers, data])
          handleSelectCustomer(data, 'customer')
          toast.success('Customer added successfully!')
        } else {
          // Quick add wholesaler
          const wholesalerData = {
            business_name: formData.get('business_name'),
            owner_name: formData.get('owner_name'),
            phone: formData.get('phone'),
            email: formData.get('email') || null,
            drug_license_number: formData.get('drug_license_number'),
            drug_license_expiry: formData.get('drug_license_expiry'),
            gstin: formData.get('gstin') || null,
            status: 'active'
          }
          
          const { data, error } = await supabase
            .from('wholesalers')
            .insert(wholesalerData)
            .select()
            .single()
          
          if (error) throw error
          
          setWholesalers([...wholesalers, data])
          handleSelectCustomer(data, 'wholesaler')
          toast.success('Wholesaler added successfully!')
        }
        
        setShowAddForm(false)
      } catch (error) {
        console.error('Error adding:', error)
        toast.error(error.message || 'Error adding entry')
      } finally {
        setAddingNew(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {isRetailMode ? '🛒 Select Retail Customer' : '📦 Select Wholesaler'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isRetailMode ? 'Choose existing customer or add new' : 'Choose existing wholesaler or add new'}
                </p>
              </div>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {!showAddForm && (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isRetailMode ? "Search customers..." : "Search wholesalers by name, phone, or license..."}
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>

                {/* Add New Button */}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full btn-primary mb-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New {isRetailMode ? 'Customer' : 'Wholesaler'}
                </button>
              </>
            )}

            {showAddForm && (
              <button
                onClick={() => setShowAddForm(false)}
                className="mb-4 text-primary-600 hover:text-primary-700 flex items-center"
              >
                ← Back to list
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-96">
            {!showAddForm ? (
              <>
                {/* Walk-in option for retail only */}
                {isRetailMode && (
                  <div
                    onClick={() => {
                      setCustomer(null)
                      setShowCustomerModal(false)
                    }}
                    className="p-4 border-2 border-yellow-300 rounded-lg mb-3 cursor-pointer hover:bg-yellow-50 bg-yellow-50"
                  >
                    <div className="font-medium">🚶 Walk-in Customer</div>
                    <div className="text-sm text-gray-500">No customer information needed</div>
                  </div>
                )}

                {/* Retail Customers List */}
                {isRetailMode && filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c, 'customer')}
                    className="p-4 border rounded-lg mb-3 cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-gray-500">{c.phone || 'No phone'}</div>
                        {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded h-fit">
                        Customer
                      </span>
                    </div>
                  </div>
                ))}

                {/* Wholesalers List */}
                {!isRetailMode && filteredWholesalers.map(w => (
                  <div
                    key={w.id}
                    onClick={() => handleSelectCustomer(w, 'wholesaler')}
                    className="p-4 border rounded-lg mb-3 cursor-pointer hover:bg-green-50 hover:border-green-300"
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{w.business_name}</div>
                        <div className="text-sm text-gray-500">{w.owner_name} • {w.phone}</div>
                        <div className="text-xs text-gray-400">License: {w.drug_license_number}</div>
                        {w.gstin && <div className="text-xs text-gray-400">GSTIN: {w.gstin}</div>}
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded h-fit">
                        Wholesaler
                      </span>
                    </div>
                  </div>
                ))}

                {/* No results */}
                {((isRetailMode && filteredCustomers.length === 0) || (!isRetailMode && filteredWholesalers.length === 0)) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No {isRetailMode ? 'customers' : 'wholesalers'} found</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-4 btn-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New {isRetailMode ? 'Customer' : 'Wholesaler'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Quick Add Form */
              <form onSubmit={handleQuickAdd} className="space-y-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  Quick Add {isRetailMode ? 'Customer' : 'Wholesaler'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isRetailMode ? (
                  /* Customer Form - matches CustomerModal individual fields */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="input-field"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className="input-field"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="input-field"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient ID
                      </label>
                      <input
                        type="text"
                        name="patient_id"
                        className="input-field"
                        placeholder="Enter patient ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
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
                        type="tel"
                        name="emergency_contact"
                        className="input-field"
                        placeholder="Enter emergency contact"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        name="address"
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
                        name="notes"
                        rows={2}
                        className="input-field"
                        placeholder="Additional notes about the customer"
                      />
                    </div>
                  </>
                ) : (
                  /* Wholesaler Form */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        name="business_name"
                        required
                        className="input-field"
                        placeholder="Business name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        name="owner_name"
                        required
                        className="input-field"
                        placeholder="Owner name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="input-field"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Drug License Number *
                      </label>
                      <input
                        type="text"
                        name="drug_license_number"
                        required
                        className="input-field"
                        placeholder="DL-XXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Expiry *
                      </label>
                      <input
                        type="date"
                        name="drug_license_expiry"
                        required
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        name="gstin"
                        className="input-field"
                        placeholder="22XXXXX1234X1ZX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="input-field"
                        placeholder="Email address"
                      />
                    </div>
                  </>
                )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingNew}
                    className="flex-1 btn-primary"
                  >
                    {addingNew ? 'Adding...' : `Add ${isRetailMode ? 'Customer' : 'Wholesaler'}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">Process sales and manage transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Sale Type Dropdown */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sale Type</label>
            <select
              value={saleType}
              onChange={(e) => {
                setSaleType(e.target.value)
                setCustomer(null) // Clear customer when switching modes
              }}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium focus:outline-none focus:border-primary-500"
            >
              <option value="retail">🛒 Retail Sale</option>
              <option value="wholesale">📦 Wholesale Sale</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Medicine Search */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines by name, generic name, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            )}

            {searchTerm.length >= 2 && !loading && <MedicineSearchResults />}
          </div>

          {/* Customer Selection */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Customer</h3>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="btn-secondary text-sm"
              >
                <User className="h-4 w-4 mr-2" />
                {customer ? 'Change' : 'Select'} Customer
              </button>
            </div>
            {customer ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{customer.name || customer.business_name}</p>
                <p className="text-sm text-gray-600">{customer.phone}</p>
                {customer.type === 'wholesaler' && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>License: {customer.drug_license_number}</p>
                    {customer.gstin && <p>GSTIN: {customer.gstin}</p>}
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Wholesaler - Wholesale Price Applied
                    </span>
                  </div>
                )}
                {customer.type === 'retailer' && (
                  <div className="mt-2 text-xs text-gray-500">
                    {customer.drug_license_number && <p>License: {customer.drug_license_number}</p>}
                    {customer.gstin && <p>GSTIN: {customer.gstin}</p>}
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                      Retailer
                    </span>
                  </div>
                )}
                {customer.type === 'customer' && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {customer.customer_type || 'Customer'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No customer selected (Walk-in customer)</p>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="space-y-6">
          {/* Cart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart ({getItemsCount()})
              </h3>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Cart is empty</p>
                <p className="text-sm">Search and add medicines to cart</p>
              </div>
            ) : (
              <>
                <CartItems />
                
                {/* Discount */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Discount %:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST:</span>
                    <span>₹{getGST().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>-₹{((getSubtotal() * discount) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Process Sale Button */}
                <button
                  onClick={() => setShowPaymentMethodModal(true)}
                  className="w-full btn-primary mt-4"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Sale
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && <PaymentMethodModal />}

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal />}

      {/* Customer Selection Modal */}
      {showCustomerModal && <CustomerSelectionModal />}

      {/* Download Last Bill */}
      {lastSale && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => downloadBill(lastSale)}
            className="btn-primary shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Last Bill
          </button>
        </div>
      )}
    </div>
  )
}

export default POSPage