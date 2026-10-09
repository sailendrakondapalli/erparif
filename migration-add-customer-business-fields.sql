-- Migration: Add business fields to customers table
-- Purpose: Allow customers table to handle individual, retailer, and wholesaler types

-- Add business-related fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS drug_license_number TEXT,
ADD COLUMN IF NOT EXISTS fssai_number TEXT,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(12,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN customers.business_name IS 'Business name for retailer/wholesaler customers';
COMMENT ON COLUMN customers.gstin IS 'GST identification number for business customers';
COMMENT ON COLUMN customers.drug_license_number IS 'Drug license number for business customers';
COMMENT ON COLUMN customers.fssai_number IS 'Food Safety and Standards Authority of India license number';
COMMENT ON COLUMN customers.credit_limit IS 'Credit limit for business customers';
COMMENT ON COLUMN customers.opening_balance IS 'Opening balance amount for the customer account';
COMMENT ON COLUMN customers.current_balance IS 'Current outstanding balance for the customer';

-- Update trigger to maintain updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to customers if not exists
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();
