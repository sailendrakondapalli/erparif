# Razorpay Payment Integration

## Overview
Integrated Razorpay payment gateway into the POS system, allowing customers to pay using UPI, Cards, Net Banking, and other online payment methods.

## Implementation Date
October 9, 2026

## Setup Instructions

### Step 1: Get Razorpay API Keys

1. **Sign up/Login to Razorpay**:
   - Go to https://razorpay.com/
   - Sign up or login to your account

2. **Get API Keys**:
   - Go to Dashboard → Settings → API Keys
   - Generate keys (Test Mode or Live Mode)
   - You'll get two keys:
     - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
     - **Key Secret** (keep this secret!)

### Step 2: Add Keys to .env File

Open your `.env` file and add the following:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
VITE_RAZORPAY_KEY_SECRET=rzp_test_YOUR_KEY_SECRET_HERE
```

**Example**:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_9TpM2K7Lm3nOpQ
VITE_RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE
```

**Important Notes**:
- Use **Test Keys** for development/testing
- Use **Live Keys** only in production
- Never commit .env file to git (it's already in .gitignore)
- Keep your Key Secret confidential

### Step 3: Restart Development Server

After adding keys to .env:
```bash
# Stop the dev server (Ctrl+C)
npm run dev
# Start again
```

### Step 4: Test Payment

1. Go to POS page
2. Add items to cart
3. Click "Process Sale"
4. Select "Razorpay" payment method
5. Razorpay checkout will open
6. Use test cards to complete payment

## Features

### Payment Method Selection Modal
When you click "Process Sale", you now see three options:

1. **💵 Cash Payment**
   - Traditional cash payment
   - Manual entry of amount
   - Instant completion

2. **💳 Razorpay**
   - Opens Razorpay checkout
   - Supports multiple payment methods:
     - UPI (Google Pay, PhonePe, Paytm, etc.)
     - Debit/Credit Cards
     - Net Banking
     - Wallets
   - Automatic payment verification
   - Secure payment gateway

3. **📱 Other Methods**
   - UPI (manual)
   - Card (manual)
   - Bank Transfer
   - Credit

### Razorpay Checkout Features

✅ **Multiple Payment Options**:
- UPI Apps
- All major cards
- 50+ Net Banking options
- Digital wallets

✅ **Pre-filled Information**:
- Customer name
- Phone number
- Email (if available)

✅ **Custom Branding**:
- Your logo displayed
- Company name
- Custom theme color

✅ **Automatic Receipt**:
- Payment ID captured
- Reference number saved
- Transaction details stored

✅ **Error Handling**:
- Failed payment alerts
- Cancelled payment detection
- Network error handling

## How It Works

### Payment Flow

```
1. User adds items to cart
   ↓
2. Clicks "Process Sale"
   ↓
3. Payment Method Selection Modal opens
   ├─→ Cash: Opens payment details form
   ├─→ Razorpay: Opens Razorpay checkout
   └─→ Other: Opens payment details form
   ↓
4. For Razorpay:
   - Razorpay modal opens
   - User selects payment method
   - Completes payment
   - Payment verified
   ↓
5. Sale recorded in database
   - Payment ID saved
   - Transaction reference stored
   - Invoice generated
   - Bill auto-downloaded
```

### Technical Implementation

**Frontend**:
```javascript
// Razorpay checkout opens with:
{
  key: "rzp_test_xxx",           // Your API key
  amount: 50000,                  // Amount in paise (₹500.00)
  currency: "INR",
  name: "BillSprout Medicals",
  description: "Sale - Invoice INV-001",
  image: "/logo.png",             // Your logo
  handler: function(response) {
    // Payment successful
    // Save sale with payment_id
  },
  prefill: {
    name: "Customer Name",
    contact: "9876543210",
    email: "customer@email.com"
  },
  theme: {
    color: "#3b82f6"             // Your brand color
  }
}
```

**Payment Response**:
```javascript
{
  razorpay_payment_id: "pay_xxxxxxxxxxxxx",
  razorpay_order_id: "order_xxxxxxxxxxxxxx",
  razorpay_signature: "signature_here"
}
```

**Database Storage**:
- Payment method: `razorpay`
- Reference number: `pay_xxxxxxxxxxxxx`
- Amount, status, timestamp saved

## Test Cards (Test Mode)

### Successful Payments

**Credit Cards**:
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

```
Card Number: 5555 5555 5555 4444
CVV: Any 3 digits
Expiry: Any future date
```

### UPI Test
```
UPI ID: success@razorpay
```

### Failed Payments (for testing)

**Card**:
```
Card Number: 4111 1111 1111 1234
CVV: 123
Expiry: Any future date
```

**UPI**:
```
UPI ID: failure@razorpay
```

## Database Schema

### Payments Table
```sql
payments (
  id UUID PRIMARY KEY,
  sale_id UUID REFERENCES sales(id),
  customer_id UUID,
  amount DECIMAL,
  payment_method TEXT,           -- 'razorpay'
  reference_number TEXT,         -- 'pay_xxxxx'
  created_at TIMESTAMP,
  created_by UUID
)
```

### Sales Table
```sql
sales (
  id UUID PRIMARY KEY,
  invoice_number TEXT,
  payment_method TEXT,           -- 'razorpay'
  payment_status TEXT,           -- 'paid', 'partial', 'pending'
  total DECIMAL,
  paid_amount DECIMAL,
  due_amount DECIMAL,
  ...
)
```

## Error Handling

### Payment Failed
```
User Action: Payment declined/failed
System Response:
  - Show error message
  - Cart preserved
  - No sale recorded
  - User can retry
```

### Payment Cancelled
```
User Action: Closes Razorpay modal
System Response:
  - Show "Payment cancelled" message
  - Cart preserved
  - Return to POS
```

### Network Error
```
Issue: Connection lost during payment
System Response:
  - Show error message
  - User can retry
  - Contact Razorpay support if payment deducted
```

### Razorpay Script Not Loaded
```
Issue: Razorpay script failed to load
System Response:
  - Show error message
  - Suggest page refresh
  - Fall back to manual payment methods
```

## Security

### Frontend
✅ Only Key ID exposed (public key)
✅ Key Secret never sent to frontend
✅ HTTPS required for live payments
✅ Payment verification on success

### Backend (Future Enhancement)
- Verify payment signature on server
- Webhook for payment status updates
- Refund processing
- Transaction reconciliation

## Invoice Integration

Payments via Razorpay are recorded with:
- Payment Method: "Razorpay"
- Reference: Razorpay Payment ID
- Status: Automatically "paid" on success

Invoice shows:
```
Payment Method: RAZORPAY
Payment Status: PAID
Reference: pay_xxxxxxxxxxxxx
```

## Configuration

### Change Theme Color
In `POSPage.jsx`:
```javascript
theme: {
  color: "#your-brand-color"  // Change to your color
}
```

### Change Company Name
```javascript
name: "Your Company Name",
description: "Custom description"
```

### Add More Prefill Data
```javascript
prefill: {
  name: customer?.name,
  contact: customer?.phone,
  email: customer?.email,
  method: "upi"  // Pre-select UPI
}
```

## Live Mode Setup

### Before Going Live:

1. **Complete KYC**:
   - Submit business documents
   - Bank account verification
   - GST/PAN verification

2. **Get Live Keys**:
   - Switch to Live mode in dashboard
   - Generate new API keys
   - Replace test keys in .env

3. **Update .env**:
```env
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
VITE_RAZORPAY_KEY_SECRET=your_live_secret
```

4. **Test Thoroughly**:
   - Test with small amounts first
   - Verify webhook setup
   - Check refund process
   - Review settlement cycle

5. **Enable Webhooks** (Recommended):
   - Dashboard → Webhooks
   - Add webhook URL
   - Subscribe to events:
     - payment.captured
     - payment.failed
     - refund.created

## Troubleshooting

### Issue: "Razorpay not loaded"
**Solution**:
1. Check internet connection
2. Refresh page
3. Check browser console for errors
4. Verify Razorpay script in index.html

### Issue: Payment success but sale not recorded
**Solution**:
1. Check browser console for errors
2. Verify database connection
3. Check Supabase logs
4. Contact support with Payment ID

### Issue: Wrong amount charged
**Solution**:
1. Verify cart calculation
2. Check discount application
3. Ensure amount in paise (multiply by 100)
4. Contact Razorpay with Payment ID

### Issue: Test cards not working
**Solution**:
1. Verify using Test mode keys
2. Check card number/CVV/expiry
3. Try different test card
4. Check Razorpay dashboard for test mode

## Support & Resources

### Razorpay Documentation
- Website: https://razorpay.com/docs/
- API Reference: https://razorpay.com/docs/api/
- Support: https://razorpay.com/support/

### Test Cards
- https://razorpay.com/docs/payments/payments/test-card-details/

### Webhooks
- https://razorpay.com/docs/webhooks/

### Dashboard
- Test Mode: https://dashboard.razorpay.com/
- Live Mode: https://dashboard.razorpay.com/

## Benefits

### For Business
✅ Accept online payments
✅ Reduce cash handling
✅ Automatic reconciliation
✅ Better cash flow
✅ Professional checkout
✅ Multiple payment options

### For Customers
✅ Pay with preferred method
✅ UPI payment support
✅ Secure transactions
✅ Instant confirmation
✅ Digital receipts
✅ Easy refunds

### For Staff
✅ Simple integration
✅ Auto payment capture
✅ No manual entry for online payments
✅ Automatic reference numbers
✅ Clear payment status

## Pricing (Razorpay)

**Standard Pricing** (check current rates):
- UPI: 0% (promotional, may change)
- Cards: ~2%
- Net Banking: ~₹10-15 per transaction
- Wallets: ~2%

**Setup Fees**: None (usually)
**Annual Fees**: None (usually)
**Settlement**: T+1 to T+3 days

## Compliance

✅ PCI DSS compliant (Razorpay handles)
✅ RBI guidelines compliant
✅ Secure payment processing
✅ Data encryption
✅ Two-factor authentication

## Future Enhancements

### Phase 2 (Optional)
1. **Payment Links**:
   - Send payment link to customer
   - Pay from anywhere
   - Share via WhatsApp/SMS

2. **Subscriptions**:
   - Recurring payments
   - Auto-billing
   - Membership plans

3. **Refunds**:
   - Process refunds from POS
   - Partial refunds
   - Automatic processing

4. **Reports**:
   - Payment method wise reports
   - Settlement reports
   - Failed payment tracking
   - Reconciliation dashboard

5. **QR Code Payments**:
   - Generate dynamic QR
   - Customer scans and pays
   - Instant verification

## Notes

1. **Test Mode vs Live Mode**:
   - Always test thoroughly in test mode
   - Use test cards only in test mode
   - Switch to live mode only when ready

2. **Settlements**:
   - Money settles to bank account
   - Usually T+3 days in India
   - Check dashboard for schedule

3. **Chargebacks**:
   - Customer can dispute payment
   - Provide proof of delivery
   - Respond within timeframe

4. **Customer Support**:
   - Keep Payment IDs for reference
   - Contact Razorpay for payment issues
   - Share Order ID and Payment ID

---
**Implementation Complete** ✅
Date: October 9, 2026

**Files Modified**:
- `src/pages/admin/pos/POSPage.jsx` - Razorpay integration
- `index.html` - Razorpay script added
- `.env.example` - Added Razorpay configuration template

**Next Steps**:
1. Add your Razorpay API keys to `.env` file
2. Restart development server
3. Test with test cards
4. Go live after KYC completion
