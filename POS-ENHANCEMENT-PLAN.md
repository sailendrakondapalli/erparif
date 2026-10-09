# POS Enhancement Plan

## Current State
- Toggle button at top right (Retail Mode / Wholesale Mode)
- Shows all stock regardless of mode
- Manual customer selection via "Select Customer" button
- Prices adjust based on mode

## Requested Changes

### 1. Replace Toggle with Dropdown ✅
**Current**: Button that toggles between Retail/Wholesale
**New**: Dropdown selector at top right
- Option 1: Retail
- Option 2: Wholesale

### 2. When "Retail" Selected
**Behavior**:
- Show retail pricing (selling_price)
- Customer selection shows:
  - Walk-in customer (default)
  - OR existing retail customers list
  - OR quick form to add new customer

### 3. When "Wholesale" Selected  
**Behavior**:
- Show wholesale pricing (wholesale_price)
- Customer selection shows:
  - Existing wholesalers list (from wholesalers table)
  - Option to add new wholesaler
  - Shows: Business name, Drug License, GSTIN

### 4. Stock Display
**Requirement**: Show ALL stock regardless of mode ✅ (Already implemented)
- Currently shows all available stock
- Filters by quantity > 0 and not expired
- No changes needed

## Implementation Notes

1. **Dropdown Component**: Replace toggle button with select dropdown
2. **Auto-trigger Modal**: When mode changes, auto-open customer selection
3. **Quick Add**: Add inline form option in customer modal for adding new entries
4. **Price Logic**: Already working - uses saleType to determine price

## Confirmation Needed
Please confirm if this understanding is correct:
- [  ] Dropdown instead of toggle button
- [  ] Auto-open customer selection when mode changes
- [  ] Quick add option in modal
- [  ] Show all stock (already working)
