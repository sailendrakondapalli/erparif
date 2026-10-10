-- Drop existing settings table if it exists (to start fresh)
DROP TABLE IF EXISTS settings CASCADE;

-- Create settings table with all required columns
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_name TEXT NOT NULL DEFAULT 'My Pharmacy',
  phone TEXT,
  address TEXT,
  email TEXT,
  website TEXT,
  gstin TEXT,
  drug_license_number TEXT,
  fssai_number TEXT,
  state TEXT,
  cgst_rate DECIMAL(5,2) DEFAULT 9.00,
  sgst_rate DECIMAL(5,2) DEFAULT 9.00,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_footer TEXT DEFAULT 'Thank you for your business!',
  auto_print_invoice BOOLEAN DEFAULT true,
  logo_url TEXT,
  low_stock_threshold INTEGER DEFAULT 10,
  expiry_alert_days INTEGER DEFAULT 30,
  block_expired_sales BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (pharmacy_name, cgst_rate, sgst_rate, invoice_prefix, invoice_footer, auto_print_invoice, low_stock_threshold, expiry_alert_days, block_expired_sales)
VALUES ('My Pharmacy', 9.00, 9.00, 'INV', 'Thank you for your business!', true, 10, 30, true);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON settings;

-- Create policies to allow all authenticated users to read and update settings
CREATE POLICY "Allow authenticated users to read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);
