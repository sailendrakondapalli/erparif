# Professional BillSprout Invoice Implementation

## Overview
Updated the POS system to generate professional invoices matching the BillSprout format with comprehensive details for both retail and wholesale transactions.

## Implementation Date
October 9, 2026

## Changes Made

### 1. Invoice Header
- **Company Logo**: BillSprout logo with plant design
- **Company Information**:
  - BillSprout Medicals and Pharmaceutical Distributors
  - Address: Main Road, Vizianagaram, Andhra Pradesh - 535001
  - Phone: 92423 45678
  - GSTIN: 37ABCDE1234F1Z5
  - Email & Website
- **Invoice Type Badge**:
  - RETAIL BILL (CASH/CARD/UPI) - for retail sales
  - TAX INVOICE WHOLESALE - for wholesale sales

### 2. Customer Section
**Retail Bill**:
- Patient Mobile Number
- Doctor Name

**Wholesale Invoice**:
- Business Name (To:)
- Complete Address
- Phone Number
- GSTIN
- Drug License Number
- Place of Supply
- Payment Terms (Credit/Cash)

### 3. Invoice Details
- Invoice Number (auto-generated)
- Date (DD-MM-YYYY format)
- Time (24-hour format HH:MM)
- Due Date (for wholesale)
- Place of Supply (for wholesale)

### 4. Items Table - Retail Bill
Columns include:
1. **Sr No** - Serial number
2. **Item Descriptions** - Medicine name with generic name
3. **Pack** - Dosage form (Tablet, Capsule, etc.)
4. **HSN Code** - HSN code for tax purposes
5. **Batch** - Batch number
6. **Exp** - Expiry date (MM/YY format)
7. **Qty** - Quantity sold
8. **RATE** - Selling price per unit
9. **GST%** - GST percentage
10. **Total Amt** - Total amount including GST

### 5. Items Table - Wholesale Invoice
Additional columns for wholesale:
1. **Free** - Free quantity
2. **M.R.P** - Maximum Retail Price
3. **Dis%** - Discount percentage
4. **Dis Amt** - Discount amount
5. **Amount** - Amount before GST
6. **GST Amt** - GST amount

### 6. GST Breakdown Section
Left side of totals shows:
- GST rate-wise breakdown
- Separate CGST and SGST (not implemented yet, showing as combined)
- IGST for interstate transactions

### 7. Totals Summary
**Common for both**:
- Gross Total
- Total Discount
- Taxable Amount
- Total Tax Amount
- Round Off
- **Net Amount** (bold, large font)

**Wholesale additional**:
- Number of items
- Subtotal
- (-)Less (discounts)
- (+-)Adjustment
- CR Amount
- Net Payable (final rounded amount)

### 8. Amount in Words
Converts net amount to Indian numbering system words:
- Examples: "Rs. Three only", "Rs. One Thousand Two Hundred Fifty Two only"
- Supports up to Lakhs

### 9. Footer Section
**Retail**:
- **GET WELL SOON** message in red
- Healthcare QR code information text

**Wholesale**:
- Terms and Conditions:
  1. Goods comply with Drugs & Cosmetics Act-1940
  2. Subject to Vizianagaram Jurisdiction
  3. Interest @ 24% p.a. on overdue payments
  4. Goods once sold will not be taken back

**Both include**:
- "For, BillSprout" signature area
- "Authorised Sign." line

## Technical Implementation

### File Modified
- `c:\Users\saile\Desktop\erpweb\src\pages\admin\pos\POSPage.jsx`

### Functions Added/Updated

#### 1. `generateBillHTML(sale)`
Complete redesign with:
- Professional table-based layout
- Conditional rendering for retail vs wholesale
- GST breakdown by rate
- Proper border styling matching BillSprout design
- Print-friendly CSS with @page settings

#### 2. `numberToWords(num)`
Helper function to convert numbers to Indian English words:
- Handles Ones, Tens, Hundreds
- Thousands (special handling)
- Lakhs (Indian numbering system)
- Returns formatted string with "only" suffix

### Data Flow
1. Sale completed in POS → `handleProcessSale()`
2. Sale data saved to database
3. `downloadBill(sale)` called automatically
4. `generateBillHTML(sale)` generates complete HTML
5. HTML downloaded as `Invoice-{invoice_number}.html`
6. User can open in browser and print

## Features

### Dynamic Content
- ✅ Real medicine names from database
- ✅ Actual batch numbers and expiry dates
- ✅ HSN codes from medicine records
- ✅ Customer/Wholesaler details
- ✅ Accurate pricing (retail vs wholesale)
- ✅ GST calculation and breakdown
- ✅ Discount handling
- ✅ Round-off calculation

### Professional Design
- ✅ Clean table borders
- ✅ Proper spacing and padding
- ✅ Red color highlights for branding
- ✅ Company logo (SVG-based)
- ✅ Print-optimized layout
- ✅ A4 page size format

### Compliance
- ✅ GSTIN display
- ✅ HSN code for each item
- ✅ GST breakdown
- ✅ Drug License Number (for wholesale)
- ✅ Terms and conditions
- ✅ Date/Time stamp

## Usage

### For Staff/Pharmacist
1. Select sale type (Retail/Wholesale) from dropdown
2. Select customer/wholesaler (or walk-in for retail)
3. Add medicines to cart
4. Click "Proceed to Payment"
5. Enter payment details
6. Click "Complete Sale"
7. Invoice automatically downloads as HTML file
8. Open file in browser to view/print

### Printing
- Open the downloaded HTML file
- Press Ctrl+P or use browser print
- Select your printer
- Print settings will automatically format for A4 size

## Database Fields Used

### From `medicines` table:
- `name` - Medicine name
- `generic_name` - Generic name
- `dosage_form` - Form/Pack (Tablet, Capsule, etc.)
- `hsn_code` - HSN code
- `gst_percentage` - GST rate

### From `medicine_batches` table:
- `batch_number` - Batch number
- `expiry_date` - Expiry date
- `mrp` - Maximum Retail Price
- `selling_price` - Retail price
- `wholesale_price` - Wholesale price

### From `customers` table:
- `name` - Customer name
- `phone` - Phone number
- `address` - Address
- `gstin` - GSTIN (for business customers)

### From `wholesalers` table:
- `business_name` - Business name
- `owner_name` - Owner name
- `phone` - Phone number
- `address` - Address
- `gstin` - GSTIN
- `drug_license_number` - Drug License Number

### From `sales` table:
- `invoice_number` - Invoice number
- `created_at` - Date and time
- `subtotal` - Subtotal before GST
- `gst_amount` - Total GST
- `discount` - Total discount
- `total` - Grand total
- `paid_amount` - Amount paid
- `due_amount` - Amount due
- `payment_method` - Payment method
- `payment_status` - Payment status
- `sale_type` - retail/wholesale

### From `sale_items` table:
- `medicine_id` - Link to medicine
- `batch_id` - Link to batch
- `quantity` - Quantity sold
- `free_quantity` - Free quantity (wholesale)
- `selling_price` - Price per unit
- `discount` - Discount on item
- `gst_percentage` - GST rate
- `gst_amount` - GST amount
- `total` - Total amount

## Future Enhancements (Optional)

1. **QR Code Integration**:
   - Generate actual QR codes for healthcare services
   - Add medicine-specific QR codes

2. **Barcode**:
   - Add barcode for invoice number
   - Medicine barcodes in item rows

3. **Split GST Display**:
   - Show CGST and SGST separately (currently combined)
   - Add IGST support for interstate

4. **PDF Generation**:
   - Convert HTML to PDF automatically
   - Email invoice option

5. **Customization**:
   - Company logo upload
   - Custom terms and conditions
   - Multiple templates

6. **Multi-language**:
   - Regional language support
   - Amount in words in local language

## Testing Checklist

- [x] Retail bill generates correctly
- [x] Wholesale invoice generates correctly
- [x] Customer details display properly
- [x] Medicine details show correctly
- [x] Prices calculate accurately
- [x] GST breakdown is correct
- [x] Discount applies properly
- [x] Round-off calculates correctly
- [x] Amount in words converts properly
- [x] Date and time format correctly
- [x] File downloads successfully
- [x] Print layout is proper
- [x] No console errors

## Notes

1. The invoice HTML is standalone and can be opened in any browser
2. All styling is inline/embedded for portability
3. Print CSS ensures proper A4 formatting
4. SVG logo ensures quality at any resolution
5. Number to words function handles Indian numbering (Lakhs)

## Support

For any issues or customization needs, contact the development team.

---
**Implementation Complete** ✅
Date: October 9, 2026
