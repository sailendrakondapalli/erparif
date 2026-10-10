# Invoice Border & FSSAI Field Updates

## Changes Made:

### 1. CustomerModal - FSSAI Field for Retailers
**File:** `src/pages/admin/customers/CustomerModal.jsx`

**Changes:**
- Added FSSAI Number field for RETAILER customers (previously only available for wholesalers)
- Retailer customers can now enter their FSSAI number in the form
- FSSAI field appears along with Opening Balance when "Retailer" customer type is selected

### 2. ThermalInvoice - Bordered Table & FSSAI Display
**File:** `src/components/ThermalInvoice.jsx`

**Changes:**

#### A. Bordered Table Styling (Professional Box Format)
- **Items Table:** Added full borders (top, bottom, left, right) around all cells
- **Table Headers:** Added solid black borders with light gray background
- **Table Data Cells:** Changed from dotted borders to solid black borders
- **Tax Summary Table:** Added borders to all cells
- **Totals Section:** Added border around entire section

**Before:** Tables had only dashed/dotted lines
**After:** Tables have professional box-style borders like traditional invoices

#### B. FSSAI Display for Retail Customers
- FSSAI number now shows on invoices for **RETAIL** customers (customer_type = 'retailer')
- Display logic:
  - **Retail Invoice (sale_type = 'retail'):**
    - Shows customer name OR business name
    - If customer_type = 'retailer': Shows Business, GSTIN, Drug License, FSSAI No
    - If customer_type = 'individual': Shows only phone (simple customer)
  - **Wholesale Invoice (sale_type = 'wholesale'):**
    - Shows M/S: (business name)
    - Shows GSTIN, Drug License, FSSAI No (unchanged)

## Visual Changes:

### Invoice Table - Before vs After

**BEFORE (Plain/Dotted):**
```
-----------------------------------
| S.N. | Item | Qty | Rate | Amt |
- - - - - - - - - - - - - - - - - 
  1      Med1   10    50     500
. . . . . . . . . . . . . . . . .
  2      Med2   5     100    500
```

**AFTER (Bordered Box):**
```
┌─────┬──────┬─────┬──────┬──────┐
│ S.N.│ Item │ Qty │ Rate │ Amt  │
├─────┼──────┼─────┼──────┼──────┤
│  1  │ Med1 │ 10  │ 50   │ 500  │
├─────┼──────┼─────┼──────┼──────┤
│  2  │ Med2 │  5  │ 100  │ 500  │
└─────┴──────┴─────┴──────┴──────┘
```

### Customer Form - Retail FSSAI Field

**Retailer Customer Type Now Shows:**
1. Business Name *
2. GSTIN
3. Drug License Number
4. **FSSAI Number** ← NEW!
5. Opening Balance

## Testing Steps:

1. **Test FSSAI Field in Customer Form:**
   - Go to Customers page
   - Add/Edit a customer
   - Select "Retailer" as customer type
   - Verify FSSAI Number field appears
   - Save customer with FSSAI number

2. **Test Invoice Display:**
   - Create a retail sale with a retailer customer (who has FSSAI)
   - Print invoice
   - Verify FSSAI number shows in customer info section
   - Verify table has solid black borders around all cells
   - Check tax summary and totals sections have borders

3. **Test Bordered Tables:**
   - Print any invoice (retail or wholesale)
   - Verify items table has complete borders
   - Verify all cells have black borders (not dotted/dashed)
   - Verify professional box-style appearance

## Notes:

- FSSAI field is optional (not required) for all customer types
- Border styling applies to all invoice prints (58mm, 80mm, A4 sizes)
- Retail customers with customer_type='retailer' will show business details
- Individual retail customers (walk-ins) only show name and phone
