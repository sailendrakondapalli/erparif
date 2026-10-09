-- Database Enhancements for ERP Requirements
-- Run this in your Supabase SQL Editor AFTER the quick-fix.sql

-- 1. Update wholesalers table to make drug registration number mandatory and GST optional
ALTER TABLE wholesalers 
  ALTER COLUMN drug_license_number SET NOT NULL,
  ALTER COLUMN gstin DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS drug_registration_number TEXT NOT NULL DEFAULT 'TEMP-REG-' || id::text;

-- Add comment to clarify the fields
COMMENT ON COLUMN wholesalers.drug_registration_number IS 'Drug Registration Number (Mandatory for all wholesalers)';
COMMENT ON COLUMN wholesalers.gstin IS 'GST Number (Optional)';

-- 2. Update medicine_batches to include better wholesaler pricing structure
ALTER TABLE medicine_batches 
  ADD COLUMN IF NOT EXISTS wholesaler_margin_percentage DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retailer_margin_percentage DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_price DECIMAL(10,2);

-- Update customer_price to be same as selling_price for existing records
UPDATE medicine_batches 
SET customer_price = selling_price 
WHERE customer_price IS NULL;

-- 3. Create a view for inventory that only shows medicines with batches
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
  m.prescription_required,
  m.low_stock_threshold,
  -- Batch information
  mb.id as batch_id,
  mb.batch_number,
  mb.expiry_date,
  mb.manufacturing_date,
  mb.current_quantity,
  mb.purchase_price,
  mb.mrp,
  mb.selling_price,
  mb.wholesale_price,
  mb.customer_price,
  mb.wholesaler_margin_percentage,
  mb.retailer_margin_percentage,
  mb.rack_location,
  -- Supplier information
  w.business_name as supplier_name,
  w.drug_registration_number as supplier_drug_reg,
  -- Stock status
  CASE 
    WHEN mb.current_quantity <= 0 THEN 'out_of_stock'
    WHEN mb.current_quantity <= m.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  -- Expiry status
  CASE 
    WHEN mb.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'good'
  END as expiry_status
FROM medicines m
INNER JOIN medicine_batches mb ON m.id = mb.medicine_id
LEFT JOIN wholesalers w ON mb.supplier_id = w.id
WHERE m.status = 'active' 
  AND mb.current_quantity > 0  -- Only show medicines with stock
ORDER BY m.name, mb.expiry_date;

-- 4. Create a function to calculate different price types
CREATE OR REPLACE FUNCTION calculate_selling_prices(
  purchase_price DECIMAL(10,2),
  mrp DECIMAL(10,2),
  wholesaler_margin DECIMAL(5,2) DEFAULT 15,
  retailer_margin DECIMAL(5,2) DEFAULT 20
)
RETURNS TABLE(
  wholesale_price DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  customer_price DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (purchase_price * (1 + wholesaler_margin / 100))::DECIMAL(10,2) as wholesale_price,
    (purchase_price * (1 + retailer_margin / 100))::DECIMAL(10,2) as retail_price,
    LEAST(mrp, (purchase_price * (1 + retailer_margin / 100)))::DECIMAL(10,2) as customer_price;
END;
$$ LANGUAGE plpgsql;

-- 5. Update customers table to include more fields for better management
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'corporate', 'insurance')),
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(12,2) DEFAULT 0;

-- 6. Create an enhanced view for customer management
CREATE OR REPLACE VIEW customers_enhanced_view AS
SELECT 
  c.*,
  -- Calculate total purchases this year
  COALESCE(SUM(s.total), 0) as total_purchases_this_year,
  -- Calculate total outstanding
  COALESCE(SUM(s.due_amount), 0) as total_outstanding,
  -- Last purchase date
  MAX(s.created_at) as last_purchase_date,
  -- Purchase count
  COUNT(s.id) as total_purchases
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id 
  AND EXTRACT(YEAR FROM s.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY c.id, c.name, c.phone, c.email, c.address, c.date_of_birth, 
         c.gender, c.patient_id, c.emergency_contact, c.notes, c.status,
         c.customer_type, c.discount_percentage, c.credit_limit, 
         c.outstanding_amount, c.created_at, c.updated_at;

-- 7. Create triggers to auto-calculate prices when adding medicine batches
CREATE OR REPLACE FUNCTION auto_calculate_batch_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- If wholesale_price, selling_price, or customer_price are not provided, calculate them
  IF NEW.wholesale_price IS NULL OR NEW.wholesale_price = 0 THEN
    NEW.wholesale_price := (NEW.purchase_price * (1 + COALESCE(NEW.wholesaler_margin_percentage, 15) / 100));
  END IF;
  
  IF NEW.selling_price IS NULL OR NEW.selling_price = 0 THEN
    NEW.selling_price := (NEW.purchase_price * (1 + COALESCE(NEW.retailer_margin_percentage, 20) / 100));
  END IF;
  
  IF NEW.customer_price IS NULL OR NEW.customer_price = 0 THEN
    NEW.customer_price := LEAST(NEW.mrp, NEW.selling_price);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto price calculation
DROP TRIGGER IF EXISTS trigger_auto_calculate_batch_prices ON medicine_batches;
CREATE TRIGGER trigger_auto_calculate_batch_prices
  BEFORE INSERT OR UPDATE ON medicine_batches
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_batch_prices();

-- 8. Insert some sample data for testing
INSERT INTO wholesalers (business_name, owner_name, phone, email, address, city, state, pincode, 
                        gstin, drug_license_number, drug_registration_number, drug_license_expiry, 
                        credit_limit, payment_terms) VALUES
('MediSupply Corp', 'Rajesh Kumar', '9876543210', 'rajesh@medisupply.com', 
 '123 Industrial Area', 'Mumbai', 'Maharashtra', '400001',
 '27AAAAA0000A1Z5', 'DL-MH-001-2024', 'DR-MH-001-2024', '2025-12-31',
 100000, 30),
('PharmaWholesale Ltd', 'Priya Sharma', '9876543211', 'priya@pharmawhole.com',
 '456 Medical District', 'Delhi', 'Delhi', '110001', 
 NULL, 'DL-DL-002-2024', 'DR-DL-002-2024', '2025-12-31',
 150000, 45)
ON CONFLICT DO NOTHING;

-- 9. Create some sample medicines with proper inventory
INSERT INTO medicines (name, generic_name, brand, manufacturer, category, composition, 
                      dosage_form, strength, prescription_required, low_stock_threshold) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Crocin', 'GSK', 'Analgesic', 'Paracetamol 500mg', 
 'Tablet', '500mg', false, 20),
('Amoxicillin 250mg', 'Amoxicillin', 'Amoxil', 'GSK', 'Antibiotic', 'Amoxicillin 250mg', 
 'Capsule', '250mg', true, 10),
('Omeprazole 20mg', 'Omeprazole', 'Omez', 'Dr. Reddy', 'Antacid', 'Omeprazole 20mg', 
 'Tablet', '20mg', true, 15)
ON CONFLICT DO NOTHING;

-- Add sample batches for these medicines
INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, 
                             purchase_price, mrp, initial_quantity, current_quantity, 
                             supplier_id, wholesaler_margin_percentage, retailer_margin_percentage) 
SELECT 
  m.id,
  'BATCH-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  CURRENT_DATE - INTERVAL '2 months',
  CURRENT_DATE + INTERVAL '18 months',
  CASE m.name 
    WHEN 'Paracetamol 500mg' THEN 2.50
    WHEN 'Amoxicillin 250mg' THEN 8.00
    WHEN 'Omeprazole 20mg' THEN 12.00
  END,
  CASE m.name 
    WHEN 'Paracetamol 500mg' THEN 5.00
    WHEN 'Amoxicillin 250mg' THEN 15.00
    WHEN 'Omeprazole 20mg' THEN 25.00
  END,
  100,
  100,
  w.id,
  15.0,
  20.0
FROM medicines m
CROSS JOIN (SELECT id FROM wholesalers LIMIT 1) w
WHERE m.name IN ('Paracetamol 500mg', 'Amoxicillin 250mg', 'Omeprazole 20mg')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database enhanced successfully! 
- Added Drug Registration Number (mandatory) and GST (optional) for wholesalers
- Created inventory view that only shows medicines with stock
- Added different pricing tiers for wholesale/retail/customer
- Enhanced customer management with types and credit limits
- Added automatic price calculation' as status;