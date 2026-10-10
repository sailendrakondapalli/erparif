import React from 'react'

// Helper function to convert number to words (Indian format)
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num === 0) return 'Zero'

  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const hundred = Math.floor((num % 1000) / 100)
  const remainder = num % 100

  let words = ''

  if (crore > 0) words += ones[crore] + ' Crore '
  if (lakh > 0) words += (lakh < 20 ? teens[lakh - 10] || ones[lakh] : tens[Math.floor(lakh / 10)] + ' ' + ones[lakh % 10]) + ' Lakh '
  if (thousand > 0) words += (thousand < 20 ? teens[thousand - 10] || ones[thousand] : tens[Math.floor(thousand / 10)] + ' ' + ones[thousand % 10]) + ' Thousand '
  if (hundred > 0) words += ones[hundred] + ' Hundred '
  if (remainder > 0) {
    if (remainder < 10) words += ones[remainder]
    else if (remainder < 20) words += teens[remainder - 10]
    else words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10]
  }

  return words.trim()
}

const amountToWords = (amount) => {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  
  let words = 'Rupees ' + numberToWords(rupees)
  if (paise > 0) words += ' and ' + numberToWords(paise) + ' Paise'
  words += ' Only'
  
  return words
}

const ThermalInvoice = ({ 
  sale, 
  items, 
  customer, 
  companyDetails,
  paperSize = '80mm' // '58mm', '80mm', or 'a4'
}) => {
  // Calculate totals
  const calculateTotals = () => {
    let totalQty = 0
    let totalFree = 0
    let subtotal = 0
    let totalDiscount = 0
    let cgst = 0
    let sgst = 0
    let igst = 0
    
    const taxSummary = {}

    items.forEach(item => {
      totalQty += item.quantity
      totalFree += item.freeQuantity || 0
      
      const itemTotal = item.quantity * item.price
      const discountAmt = (itemTotal * (item.discount || 0)) / 100
      const taxableAmount = itemTotal - discountAmt
      
      subtotal += itemTotal
      totalDiscount += discountAmt
      
      const gstRate = item.medicine.gst_percentage || 0
      const gstAmount = (taxableAmount * gstRate) / 100
      
      // For intra-state: split into CGST and SGST
      const cgstAmount = gstAmount / 2
      const sgstAmount = gstAmount / 2
      
      cgst += cgstAmount
      sgst += sgstAmount
      
      // Group by GST rate for summary
      if (!taxSummary[gstRate]) {
        taxSummary[gstRate] = { taxable: 0, cgst: 0, sgst: 0 }
      }
      taxSummary[gstRate].taxable += taxableAmount
      taxSummary[gstRate].cgst += cgstAmount
      taxSummary[gstRate].sgst += sgstAmount
    })

    const taxableValue = subtotal - totalDiscount
    const totalTax = cgst + sgst + igst
    const grandTotal = taxableValue + totalTax
    const roundOff = Math.round(grandTotal) - grandTotal
    const netPayable = Math.round(grandTotal)

    return {
      totalQty,
      totalFree,
      subtotal,
      totalDiscount,
      taxableValue,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal,
      roundOff,
      netPayable,
      taxSummary
    }
  }

  const totals = calculateTotals()
  const isWholesale = sale.sale_type === 'wholesale'
  const invoiceDate = new Date(sale.created_at)

  return (
    <div className={`thermal-invoice ${paperSize}`}>
      <style>{`
        .thermal-invoice {
          font-family: 'Courier New', monospace;
          background: white;
          color: black;
          padding: 6px;
          font-size: 10px;
          line-height: 1.2;
        }

        .thermal-invoice.58mm { width: 58mm; font-size: 8px; }
        .thermal-invoice.80mm { width: 80mm; font-size: 10px; }
        .thermal-invoice.a4 { width: 210mm; padding: 15mm; font-size: 11px; }

        .thermal-invoice * {
          margin: 0;
          padding: 0;
        }

        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }

        .company-name {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .company-info {
          font-size: 9px;
          line-height: 1.4;
        }

        .invoice-title {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 6px 0;
          text-decoration: underline;
        }

        .invoice-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10px;
        }

        .customer-info {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 4px 0;
          margin: 6px 0;
          font-size: 10px;
        }

        .info-row {
          display: flex;
          margin-bottom: 2px;
        }

        .info-label {
          width: 35%;
          font-weight: bold;
        }

        .info-value {
          width: 65%;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
          font-size: 8px;
          border: 1px solid #000;
        }

        .items-table th {
          border: 1px solid #000;
          padding: 2px 1px;
          text-align: left;
          font-weight: bold;
          font-size: 7px;
          background-color: #f5f5f5;
        }

        .items-table td {
          padding: 2px 1px;
          border: 1px solid #000;
          vertical-align: top;
        }

        .items-table .text-right {
          text-align: right;
        }

        .items-table .text-center {
          text-align: center;
        }

        .medicine-name {
          font-weight: bold;
          font-size: 10px;
          word-wrap: break-word;
        }

        .tax-summary {
          border: 1px solid #000;
          padding: 4px;
          margin: 4px 0;
          font-size: 9px;
        }

        .tax-summary-table {
          width: 100%;
          margin: 4px 0;
          border-collapse: collapse;
        }

        .tax-summary-table td {
          padding: 2px 4px;
          border: 1px solid #000;
        }

        .totals-section {
          border: 1px solid #000;
          padding: 6px;
          margin-top: 4px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 10px;
        }

        .total-row.grand {
          font-size: 13px;
          font-weight: bold;
          border-top: 1px solid #000;
          border-bottom: 1px double #000;
          padding: 4px 0;
          margin: 4px 0;
        }

        .amount-words {
          margin: 6px 0;
          font-size: 9px;
          font-style: italic;
          text-align: center;
        }

        .footer {
          border-top: 1px dashed #000;
          padding-top: 6px;
          margin-top: 6px;
          text-align: center;
          font-size: 9px;
        }

        .signature-area {
          display: flex;
          justify-content: space-between;
          margin: 15px 0 10px;
        }

        @media print {
          .thermal-invoice {
            margin: 0;
            padding: 0;
          }
          
          .thermal-invoice.58mm {
            width: 58mm;
            padding: 2mm;
          }
          
          .thermal-invoice.80mm {
            width: 80mm;
            padding: 3mm;
          }
          
          .thermal-invoice.a4 {
            width: 210mm;
            height: 297mm;
            padding: 15mm;
          }

          @page {
            margin: 0;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="company-name">{companyDetails.name || 'LIFESPROUTS CARE'}</div>
        <div className="company-info">
          {companyDetails.address || '2-190/6 Peikaji Nagar Asifabad, Kommurum Bheem Asifabad'}<br/>
          {companyDetails.city || 'TELANGANA-504203'}<br/>
          GSTIN: {companyDetails.gstin || '36CTUPD3541E1ZO'}<br/>
          D.L NO: {companyDetails.drug_license || '(20B&21B)TG/AS/2025-139054'}<br/>
          Phone: {companyDetails.phone || '9666105832, 9959838249'}<br/>
          E-Mail: {companyDetails.email || 'vedithapharma@gmail.com'}
        </div>
      </div>

      {/* Invoice Title */}
      <div className="invoice-title">{isWholesale ? 'TAX INVOICE' : 'GST INVOICE'}</div>

      {/* Invoice Metadata */}
      <div className="invoice-meta">
        <div>
          <strong>Invoice No:</strong> {sale.invoice_number}
        </div>
        <div>
          <strong>Date:</strong> {invoiceDate.toLocaleDateString('en-GB')}
        </div>
      </div>
      <div className="invoice-meta">
        <div>
          <strong>Time:</strong> {invoiceDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div>
          <strong>Payment:</strong> {sale.payment_method.toUpperCase()}
        </div>
      </div>

      {/* Customer Information */}
      <div className="customer-info">
        {isWholesale ? (
          <>
            <div className="info-row">
              <div className="info-label">M/S:</div>
              <div className="info-value">{customer?.business_name || 'Walk-in Customer'}</div>
            </div>
            {customer?.address && (
              <div className="info-row">
                <div className="info-label">Address:</div>
                <div className="info-value">{customer.address}</div>
              </div>
            )}
            {customer?.gstin && (
              <div className="info-row">
                <div className="info-label">GSTIN:</div>
                <div className="info-value">{customer.gstin}</div>
              </div>
            )}
            {customer?.drug_license_number && (
              <div className="info-row">
                <div className="info-label">Drug License:</div>
                <div className="info-value">{customer.drug_license_number}</div>
              </div>
            )}
            {customer?.fssai_number && (
              <div className="info-row">
                <div className="info-label">FSSAI No:</div>
                <div className="info-value">{customer.fssai_number}</div>
              </div>
            )}
            {customer?.phone && (
              <div className="info-row">
                <div className="info-label">Phone:</div>
                <div className="info-value">{customer.phone}</div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="info-row">
              <div className="info-label">Customer:</div>
              <div className="info-value">{customer?.name || customer?.business_name || 'Walk-in Customer'}</div>
            </div>
            {customer?.customer_type === 'retailer' && customer?.business_name && (
              <div className="info-row">
                <div className="info-label">Business:</div>
                <div className="info-value">{customer.business_name}</div>
              </div>
            )}
            {customer?.customer_type === 'retailer' && customer?.gstin && (
              <div className="info-row">
                <div className="info-label">GSTIN:</div>
                <div className="info-value">{customer.gstin}</div>
              </div>
            )}
            {customer?.customer_type === 'retailer' && customer?.drug_license_number && (
              <div className="info-row">
                <div className="info-label">Drug License:</div>
                <div className="info-value">{customer.drug_license_number}</div>
              </div>
            )}
            {customer?.customer_type === 'retailer' && customer?.fssai_number && (
              <div className="info-row">
                <div className="info-label">FSSAI No:</div>
                <div className="info-value">{customer.fssai_number}</div>
              </div>
            )}
            {customer?.phone && (
              <div className="info-row">
                <div className="info-label">Phone:</div>
                <div className="info-value">{customer.phone}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th style={{width: '20px'}}>S.N.</th>
            <th style={{width: '40px'}}>HSN</th>
            <th style={{width: '40px'}}>MFG</th>
            <th>Item Name</th>
            <th style={{width: '35px'}}>Pack</th>
            <th style={{width: '25px'}}>Qty</th>
            <th style={{width: '25px'}}>Fr.</th>
            <th style={{width: '50px'}}>Batch</th>
            <th style={{width: '35px'}}>Exp.</th>
            <th style={{width: '45px'}} className="text-right">M.R.P</th>
            <th style={{width: '45px'}} className="text-right">Rate</th>
            <th style={{width: '35px'}}>Dis%</th>
            <th style={{width: '40px'}}>SGST</th>
            <th style={{width: '40px'}}>CGST</th>
            <th style={{width: '55px'}} className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const itemTotal = item.quantity * item.price
            const discountAmt = (itemTotal * (item.discount || 0)) / 100
            const taxableAmount = itemTotal - discountAmt
            const gstRate = item.medicine.gst_percentage || 0
            const gstAmount = (taxableAmount * gstRate) / 100
            const sgstAmount = gstAmount / 2
            const cgstAmount = gstAmount / 2
            const totalWithGst = taxableAmount + gstAmount
            
            return (
              <tr key={index}>
                <td className="text-center">{index + 1}</td>
                <td className="text-center" style={{fontSize: '8px'}}>{item.medicine.hsn_code || '3004'}</td>
                <td className="text-center" style={{fontSize: '7px'}}>{item.medicine.manufacturer?.substring(0, 6) || 'N/A'}</td>
                <td>
                  <div className="medicine-name">{item.medicine.name}</div>
                </td>
                <td className="text-center" style={{fontSize: '8px'}}>{item.medicine.pack_size || '10'}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-center">{item.freeQuantity || 0}</td>
                <td className="text-center" style={{fontSize: '8px'}}>{item.batch.batch_number}</td>
                <td className="text-center" style={{fontSize: '8px'}}>
                  {new Date(item.batch.expiry_date).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}
                </td>
                <td className="text-right">{(item.batch.mrp || item.price).toFixed(2)}</td>
                <td className="text-right">{item.price.toFixed(2)}</td>
                <td className="text-center" style={{fontSize: '8px'}}>{(item.discount || 0).toFixed(1)}%</td>
                <td className="text-center" style={{fontSize: '8px'}}>{(gstRate / 2).toFixed(1)}%</td>
                <td className="text-center" style={{fontSize: '8px'}}>{(gstRate / 2).toFixed(1)}%</td>
                <td className="text-right"><strong>{totalWithGst.toFixed(2)}</strong></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Tax Summary */}
      <div className="tax-summary">
        <strong>Tax Summary:</strong>
        <table className="tax-summary-table">
          <tbody>
            {Object.entries(totals.taxSummary).map(([rate, data]) => (
              <tr key={rate}>
                <td>GST {rate}%:</td>
                <td className="text-right">Taxable: ₹{data.taxable.toFixed(2)}</td>
                <td className="text-right">CGST: ₹{data.cgst.toFixed(2)}</td>
                <td className="text-right">SGST: ₹{data.sgst.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="total-row">
          <span>Total Qty:</span>
          <span><strong>{totals.totalQty}</strong></span>
        </div>
        <div className="total-row">
          <span>Total Free:</span>
          <span><strong>{totals.totalFree}</strong></span>
        </div>
        <div className="total-row">
          <span>Subtotal:</span>
          <span>₹{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Total Discount:</span>
          <span>₹{totals.totalDiscount.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Taxable Value:</span>
          <span>₹{totals.taxableValue.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Total CGST:</span>
          <span>₹{totals.cgst.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Total SGST:</span>
          <span>₹{totals.sgst.toFixed(2)}</span>
        </div>
        {totals.igst > 0 && (
          <div className="total-row">
            <span>Total IGST:</span>
            <span>₹{totals.igst.toFixed(2)}</span>
          </div>
        )}
        <div className="total-row">
          <span>Round Off:</span>
          <span>₹{totals.roundOff.toFixed(2)}</span>
        </div>
        <div className="total-row grand">
          <span>NET PAYABLE:</span>
          <span>₹{totals.netPayable.toFixed(2)}</span>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="amount-words">
        <strong>Amount in Words:</strong><br/>
        {amountToWords(totals.netPayable)}
      </div>

      {/* Signature Area */}
      {paperSize === 'a4' && (
        <div className="signature-area">
          <div>
            <div>Customer Signature</div>
            <div style={{marginTop: '30px', borderTop: '1px solid #000', width: '150px'}}></div>
          </div>
          <div>
            <div>Authorized Signatory</div>
            <div style={{marginTop: '30px', borderTop: '1px solid #000', width: '150px'}}></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <div style={{marginBottom: '4px'}}>** Goods once sold are not returnable **</div>
        <div style={{marginBottom: '4px'}}>This is a computer-generated invoice</div>
        <div style={{fontWeight: 'bold'}}>Thank you for your business!</div>
        <div style={{marginTop: '4px', fontSize: '8px'}}>Powered by BillSprout ERP</div>
      </div>
    </div>
  )
}

export default ThermalInvoice
