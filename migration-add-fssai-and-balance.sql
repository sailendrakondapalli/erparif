-- Migration: Add FSSAI number and opening balance fields
-- Purpose: Support FSSAI tracking for wholesalers and opening balance for retailers/wholesalers

-- Add FSSAI field to wholesalers table
ALTER TABLE wholesalers 
ADD COLUMN IF NOT EXISTS fssai_number TEXT,
ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(12,2) DEFAULT 0;

-- Add opening balance field to retailers table
ALTER TABLE retailers 
ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(12,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN wholesalers.fssai_number IS 'Food Safety and Standards Authority of India license number';
COMMENT ON COLUMN wholesalers.opening_balance IS 'Opening balance amount for the wholesaler account';
COMMENT ON COLUMN wholesalers.current_balance IS 'Current outstanding balance for the wholesaler';
COMMENT ON COLUMN retailers.opening_balance IS 'Opening balance amount for the retailer account';
COMMENT ON COLUMN retailers.current_balance IS 'Current outstanding balance for the retailer';

-- Update trigger to maintain updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to wholesalers if not exists
DROP TRIGGER IF EXISTS update_wholesalers_updated_at ON wholesalers;
CREATE TRIGGER update_wholesalers_updated_at
    BEFORE UPDATE ON wholesalers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to retailers if not exists
DROP TRIGGER IF EXISTS update_retailers_updated_at ON retailers;
CREATE TRIGGER update_retailers_updated_at
    BEFORE UPDATE ON retailers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
