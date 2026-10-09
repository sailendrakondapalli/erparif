-- Migration: Add wholesaler-specific pricing and customer categorization
-- Run this migration on your existing database

-- 1. Add customer_type to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'individual' 
CHECK (customer_type IN ('individual', 'retailer', 'wholesaler'));

-- 2. Make wholesalers.gstin optional (change from NOT NULL to nullable)
ALTER TABLE wholesalers 
ALTER COLUMN gstin DROP NOT NULL;

-- 3. Add supplier_purchase_price to medicine_batches for wholesaler-specific pricing
ALTER TABLE medicine_batches 
ADD COLUMN IF NOT EXISTS supplier_purchase_price DECIMAL(10,2);

-- 4. Set default supplier_purchase_price for existing batches (copy from purchase_price)
UPDATE medicine_batches 
SET supplier_purchase_price = purchase_price 
WHERE supplier_purchase_price IS NULL;

-- 5. Make supplier_purchase_price NOT NULL after setting defaults
ALTER TABLE medicine_batches 
ALTER COLUMN supplier_purchase_price SET NOT NULL;

-- 6. Create index for customer_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);

-- 7. Create view for inventory with supplier information
CREATE OR REPLACE VIEW inventory_view AS
SELECT 
  m.id as medicine_id,
  m.name,
  m.generic_name,
  m.brand,
  m.manufacturer,
  m.category,
  m.dosage_form,
  m.strength,
  m.low_stock_threshold,
  mb.id as batch_id,
  mb.batch_number,
  mb.manufacturing_date,
  mb.expiry_date,
  mb.purchase_price,
  mb.supplier_purchase_price,
  mb.mrp,
  mb.selling_price,
  mb.wholesale_price,
  mb.gst_percentage,
  mb.current_quantity,
  mb.rack_location,
  w.id as supplier_id,
  w.business_name as supplier_name,
  w.drug_license_number as supplier_drug_reg,
  w.gstin as supplier_gstin,
  -- Stock status
  CASE 
    WHEN mb.current_quantity = 0 THEN 'out_of_stock'
    WHEN mb.current_quantity <= m.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  -- Expiry status
  CASE 
    WHEN mb.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '3 months' THEN 'expiring_soon'
    ELSE 'good'
  END as expiry_status,
  mb.selling_price as customer_price
FROM medicines m
INNER JOIN medicine_batches mb ON m.id = mb.medicine_id
LEFT JOIN wholesalers w ON mb.supplier_id = w.id
WHERE mb.current_quantity > 0 OR mb.expiry_date > CURRENT_DATE
ORDER BY m.name, mb.expiry_date;

COMMENT ON COLUMN customers.customer_type IS 'Type of customer: individual (walk-in), retailer, or wholesaler';
COMMENT ON COLUMN wholesalers.gstin IS 'GST Identification Number (optional)';
COMMENT ON COLUMN wholesalers.drug_license_number IS 'Drug License Number (mandatory)';
COMMENT ON COLUMN medicine_batches.supplier_purchase_price IS 'Price paid to the specific supplier/wholesaler for this batch';
COMMENT ON COLUMN medicine_batches.purchase_price IS 'Standard/average purchase price for accounting';
