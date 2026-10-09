-- Fix: Remove wholesaler_id and retailer_id foreign key constraints from sales table
-- Since we only use the customers table, these constraints cause errors

-- Drop foreign key constraints if they exist
ALTER TABLE sales 
DROP CONSTRAINT IF EXISTS sales_wholesaler_id_fkey,
DROP CONSTRAINT IF EXISTS sales_retailer_id_fkey;

-- Drop the columns if they exist (optional - only if you want to clean up)
ALTER TABLE sales 
DROP COLUMN IF EXISTS wholesaler_id,
DROP COLUMN IF EXISTS retailer_id;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;
