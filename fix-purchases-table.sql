-- Fix purchases table to use correct table references

-- Add status column to purchases if it doesn't exist
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add payment_method column if it doesn't exist
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- Rename total to total_amount for consistency (if column exists)
DO $$ 
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name='purchases' AND column_name='total') THEN
        ALTER TABLE purchases RENAME COLUMN total TO total_amount;
    END IF;
END $$;

-- Add total_amount if it doesn't exist
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2);

-- Create a view so "suppliers" queries work with your "wholesalers" table
CREATE OR REPLACE VIEW suppliers AS
SELECT 
    id,
    business_name as name,
    business_name as company_name,
    owner_name as contact_person,
    phone,
    email,
    address,
    city,
    state,
    pincode,
    gstin,
    drug_license_number,
    credit_limit,
    0 as opening_balance,
    0 as current_balance,
    status,
    created_at,
    updated_at
FROM wholesalers;
