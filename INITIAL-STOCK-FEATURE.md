# Initial Stock Feature in Add Medicine Form

## Overview
Added the ability to add initial stock/inventory directly when creating a new medicine, eliminating the need for a separate "Add Batch" step for the first batch.

## Implementation Date
October 9, 2026

## What Changed

### Before
1. Add Medicine (basic info only)
2. Find medicine in list
3. Click "Add Batch" button
4. Fill batch details and stock

### After
1. Add Medicine with optional initial stock fields
2. Done! Medicine and first batch created together

## New Fields in Add Medicine Form

### Initial Stock Section (Optional)
This section only appears when **adding a new medicine** (not when editing):

1. **Batch Number** (optional)
   - Auto-generated if left empty
   - Format: `BATCH-{timestamp}`
   - Example: `BATCH-1696867200000`

2. **Initial Quantity** (number)
   - Opening stock count
   - Example: 100, 500, 1000

3. **Expiry Date** (date)
   - Batch expiry date
   - Defaults to 1 year from today if not provided

4. **MRP** - Maximum Retail Price (₹)
   - Printed price on package
   - Example: 50.00, 125.50

5. **Selling Price** (₹)
   - Retail sale price
   - Used in POS for retail customers

6. **Wholesale Price** (₹)
   - Bulk/wholesale rate
   - Used in POS for wholesalers

7. **Purchase Price** (₹)
   - Your cost price from supplier
   - Used for profit calculations

## Features

### ✅ Completely Optional
- Skip all fields → medicine created without stock
- Add stock later using "Add Batch" button
- No fields are mandatory in this section

### ✅ Smart Defaults
- **Batch Number**: Auto-generated if empty
- **Expiry Date**: 1 year from today if not set
- **Prices**: Default to 0 if not provided

### ✅ Validation
- Quantity must be ≥ 0
- Prices must be ≥ 0
- Expiry date validated as proper date

### ✅ Clear Instructions
- Helper text explains the feature
- Note reminds users they can skip and add later
- Blue info box with guidance

## How It Works

### Scenario 1: Add Medicine with Initial Stock
```
User fills:
- Medicine Name: Paracetamol 500mg
- Category: Pain Relief
- Initial Quantity: 500
- Selling Price: 5.00
- MRP: 10.00

Result:
✅ Medicine created
✅ First batch created automatically
✅ Stock shows 500 units
✅ Ready to sell immediately
```

### Scenario 2: Add Medicine Without Stock
```
User fills:
- Medicine Name: Paracetamol 500mg
- Category: Pain Relief
- Initial Stock: (skipped)

Result:
✅ Medicine created
❌ No batch created
✅ Stock shows 0 units
✅ Can add batches later
```

## Database Flow

### When Initial Stock Provided:

1. **Create Medicine**
```sql
INSERT INTO medicines (
  name, category, dosage_form, ...
) VALUES (...)
RETURNING id
```

2. **Create Initial Batch** (automatic)
```sql
INSERT INTO medicine_batches (
  medicine_id,
  batch_number,
  quantity,
  current_quantity,
  expiry_date,
  mrp,
  selling_price,
  wholesale_price,
  supplier_purchase_price
) VALUES (...)
```

### When Initial Stock Skipped:

1. **Create Medicine Only**
```sql
INSERT INTO medicines (
  name, category, dosage_form, ...
) VALUES (...)
```

2. No batch created
3. User can add batches later

## UI Changes

### Form Layout
```
┌─────────────────────────────────────┐
│ Add New Medicine                    │
├─────────────────────────────────────┤
│ Basic Information                   │
│ ├─ Medicine Name                    │
│ ├─ Generic Name                     │
│ ├─ Category                         │
│ └─ ...                              │
├─────────────────────────────────────┤
│ Tax & Regulatory                    │
│ ├─ GST Rate                         │
│ └─ ...                              │
├─────────────────────────────────────┤
│ Description                         │
├─────────────────────────────────────┤
│ ✨ Initial Stock (Optional) ✨      │
│ ├─ Batch Number                     │
│ ├─ Initial Quantity                 │
│ ├─ Expiry Date                      │
│ ├─ MRP                              │
│ ├─ Selling Price                    │
│ ├─ Wholesale Price                  │
│ └─ Purchase Price                   │
│                                     │
│ ℹ️ Note: Skip to add stock later    │
├─────────────────────────────────────┤
│        [Cancel]  [Add Medicine]     │
└─────────────────────────────────────┘
```

### Medicines Table
```
Stock Column Now Shows:
┌──────────┬─────────────────┐
│  Stock   │ Medicine Name   │
├──────────┼─────────────────┤
│   500    │ Paracetamol     │
│ 2 batches│                 │
├──────────┼─────────────────┤
│    0     │ Aspirin         │
│ 0 batches│                 │
└──────────┴─────────────────┘
```

## Benefits

### For Users
✅ **Faster Setup**: Add medicine + stock in one go
✅ **Flexibility**: Can still skip and add later
✅ **Less Clicks**: No need to find medicine and click "Add Batch"
✅ **Immediate Sales**: Stock ready to sell right away
✅ **Better UX**: More intuitive workflow

### For Business
✅ **Faster Onboarding**: Stock up inventory quickly
✅ **Reduced Errors**: All info in one place
✅ **Better Tracking**: Initial batch timestamp
✅ **Complete Data**: Prices captured from start

## Code Changes

### Files Modified
- `src/pages/admin/medicines/MedicineModal.jsx`
- `src/pages/admin/medicines/MedicinesPage.jsx` (stock column display)

### Schema Changes
None required! Uses existing tables:
- `medicines` - Medicine information
- `medicine_batches` - Stock/batch information

## Usage Examples

### Example 1: New Medicine with Full Details
```javascript
{
  // Medicine Info
  name: "Amoxicillin 500mg",
  category: "Antibiotics",
  dosage_form: "Capsule",
  
  // Initial Stock
  initial_batch_number: "AMX-001",
  initial_quantity: 1000,
  initial_expiry_date: "2025-12-31",
  initial_mrp: 150.00,
  initial_selling_price: 120.00,
  initial_wholesale_price: 100.00,
  initial_purchase_price: 80.00
}
```

### Example 2: Quick Add (Minimal)
```javascript
{
  // Medicine Info
  name: "Cough Syrup",
  category: "Respiratory",
  dosage_form: "Syrup",
  
  // Initial Stock (minimal)
  initial_quantity: 50,
  initial_selling_price: 85.00
  
  // Auto-filled:
  // - batch_number: BATCH-1696867200
  // - expiry_date: 2025-10-09
  // - mrp: 0
  // - wholesale_price: 0
  // - purchase_price: 0
}
```

## Error Handling

### Success Messages
- **With Stock**: "Medicine and initial stock added successfully"
- **Without Stock**: "Medicine added successfully"
- **Batch Error**: "Medicine added but failed to create initial batch"

### Validation
- Quantity cannot be negative
- Prices cannot be negative
- Expiry date must be valid date format

### Edge Cases
- Empty batch number → auto-generate
- Empty expiry date → default to 1 year ahead
- Zero quantity → skip batch creation
- Missing prices → default to 0

## Testing Checklist

- [x] Add medicine with full stock details
- [x] Add medicine with minimal stock (quantity only)
- [x] Add medicine without any stock
- [x] Auto-generate batch number works
- [x] Default expiry date works
- [x] Stock displays correctly in table
- [x] Batch created with correct data
- [x] Medicine-batch relationship correct
- [x] Edit medicine doesn't show stock fields
- [x] No console errors

## Future Enhancements (Optional)

1. **Auto-calculate Prices**:
   - Suggest selling price based on MRP and margin
   - Calculate wholesale price from purchase + markup

2. **Batch Templates**:
   - Save common batch settings
   - Quick-fill from template

3. **Supplier Integration**:
   - Select supplier from dropdown
   - Auto-fill purchase price from history

4. **Multiple Batches**:
   - Add multiple batches at once
   - Batch entry table

5. **Import from CSV**:
   - Bulk import medicines with stock
   - Excel template download

## Notes

1. **Only for New Medicines**: Stock fields only show when adding (not editing)
2. **Backward Compatible**: Existing workflow still works (add medicine, then batch)
3. **No Breaking Changes**: All changes are additive
4. **Flexible**: Users can choose their preferred workflow

## Support

### Common Questions

**Q: Can I edit stock later?**
A: Yes! Use "Add Batch" button or edit existing batches.

**Q: What if I don't know prices yet?**
A: Skip the stock section and add it later when you have the info.

**Q: Can I add multiple batches during creation?**
A: Currently only one initial batch. Add more using "Add Batch" button.

**Q: Will this create duplicate batches?**
A: No, only one batch is created if quantity > 0.

---
**Implementation Complete** ✅
Date: October 9, 2026

**Files Modified**:
- `src/pages/admin/medicines/MedicineModal.jsx` (stock fields + logic)
- `src/pages/admin/medicines/MedicinesPage.jsx` (stock column display)
