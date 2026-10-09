-- Pharmacy ERP Database Schema
-- This file contains all the SQL statements to set up the database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pharmacist', 'staff', 'patient', 'retailer', 'wholesaler')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medicines table
CREATE TABLE medicines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand TEXT,
  manufacturer TEXT,
  category TEXT,
  composition TEXT,
  dosage_form TEXT,
  strength TEXT,
  hsn_code TEXT,
  gst_percentage DECIMAL(5,2) DEFAULT 0,
  prescription_required BOOLEAN DEFAULT false,
  description TEXT,
  low_stock_threshold INTEGER DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wholesalers table
CREATE TABLE wholesalers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT NOT NULL,
  drug_license_number TEXT NOT NULL,
  drug_license_expiry DATE NOT NULL,
  pan TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create retailers table
CREATE TABLE retailers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  state TEXT,
  gstin TEXT,
  drug_license_number TEXT,
  drug_license_expiry DATE,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  patient_id TEXT,
  emergency_contact TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medicine_batches table
CREATE TABLE medicine_batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2) NOT NULL,
  gst_percentage DECIMAL(5,2) DEFAULT 0,
  initial_quantity INTEGER NOT NULL,
  current_quantity INTEGER NOT NULL,
  free_quantity INTEGER DEFAULT 0,
  rack_location TEXT,
  supplier_id UUID REFERENCES wholesalers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medicine_id, batch_number)
);

-- Create purchases table
CREATE TABLE purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES wholesalers(id),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  due_amount DECIMAL(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchase_items table
CREATE TABLE purchase_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id),
  batch_id UUID REFERENCES medicine_batches(id),
  quantity INTEGER NOT NULL,
  free_quantity INTEGER DEFAULT 0,
  purchase_price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  gst_percentage DECIMAL(5,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  retailer_id UUID REFERENCES retailers(id),
  wholesaler_id UUID REFERENCES wholesalers(id),
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  due_amount DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'credit')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  sale_type TEXT DEFAULT 'retail' CHECK (sale_type IN ('retail', 'wholesale')),
  prescription_reference TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id),
  batch_id UUID REFERENCES medicine_batches(id),
  quantity INTEGER NOT NULL,
  free_quantity INTEGER DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  gst_percentage DECIMAL(5,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medicine_id UUID REFERENCES medicines(id),
  batch_id UUID REFERENCES medicine_batches(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment', 'damage', 'expiry', 'free', 'transfer')),
  quantity INTEGER NOT NULL,
  free_quantity INTEGER DEFAULT 0,
  reference_type TEXT CHECK (reference_type IN ('purchase', 'sale', 'return', 'adjustment')),
  reference_id UUID,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id),
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'credit')),
  reference_number TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create returns table
CREATE TABLE returns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id),
  return_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create return_items table
CREATE TABLE return_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id UUID REFERENCES sale_items(id),
  medicine_id UUID REFERENCES medicines(id),
  batch_id UUID REFERENCES medicine_batches(id),
  quantity INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicine_batches_expiry ON medicine_batches(expiry_date);
CREATE INDEX idx_medicine_batches_medicine_id ON medicine_batches(medicine_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_stock_movements_medicine_id ON stock_movements(medicine_id);
CREATE INDEX idx_stock_movements_batch_id ON stock_movements(batch_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- Create functions for automatic invoice number generation
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the next invoice number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM sales
  WHERE invoice_number ~ '^INV-\d{4}-\d+$'
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format the invoice number
  invoice_number := 'INV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_number::TEXT, 8, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update stock after sale
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Update batch quantity
  UPDATE medicine_batches
  SET current_quantity = current_quantity - (NEW.quantity + NEW.free_quantity),
      updated_at = NOW()
  WHERE id = NEW.batch_id;
  
  -- Create stock movement record
  INSERT INTO stock_movements (
    medicine_id, batch_id, movement_type, quantity, free_quantity,
    reference_type, reference_id, created_by
  ) VALUES (
    NEW.medicine_id, NEW.batch_id, 'sale', NEW.quantity, NEW.free_quantity,
    'sale', NEW.sale_id, 
    (SELECT created_by FROM sales WHERE id = NEW.sale_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to restore stock after return
CREATE OR REPLACE FUNCTION restore_stock_after_return()
RETURNS TRIGGER AS $$
BEGIN
  -- Update batch quantity
  UPDATE medicine_batches
  SET current_quantity = current_quantity + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.batch_id;
  
  -- Create stock movement record
  INSERT INTO stock_movements (
    medicine_id, batch_id, movement_type, quantity,
    reference_type, reference_id, created_by
  ) VALUES (
    NEW.medicine_id, NEW.batch_id, 'return', NEW.quantity,
    'return', NEW.return_id,
    (SELECT processed_by FROM returns WHERE id = NEW.return_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update stock after purchase
CREATE OR REPLACE FUNCTION update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Update batch quantity
  UPDATE medicine_batches
  SET current_quantity = current_quantity + (NEW.quantity + NEW.free_quantity),
      updated_at = NOW()
  WHERE id = NEW.batch_id;
  
  -- Create stock movement record
  INSERT INTO stock_movements (
    medicine_id, batch_id, movement_type, quantity, free_quantity,
    reference_type, reference_id, created_by
  ) VALUES (
    NEW.medicine_id, NEW.batch_id, 'purchase', NEW.quantity, NEW.free_quantity,
    'purchase', NEW.purchase_id,
    (SELECT created_by FROM purchases WHERE id = NEW.purchase_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_stock_after_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_sale();

CREATE TRIGGER trigger_restore_stock_after_return
  AFTER INSERT ON return_items
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_after_return();

CREATE TRIGGER trigger_update_stock_after_purchase
  AFTER INSERT ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_purchase();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesalers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see their own profile, admins can see all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Medicines: All authenticated users can read, only admins/pharmacists can modify
CREATE POLICY "All users can view medicines" ON medicines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pharmacist can manage medicines" ON medicines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pharmacist')
    )
  );

-- Medicine batches: Similar to medicines
CREATE POLICY "All users can view batches" ON medicine_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pharmacist can manage batches" ON medicine_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pharmacist')
    )
  );

-- Sales: Users can only see sales they created or are customers of
CREATE POLICY "Users can view relevant sales" ON sales
  FOR SELECT USING (
    created_by = auth.uid() OR
    customer_id IN (
      SELECT id FROM customers WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pharmacist', 'staff')
    )
  );

CREATE POLICY "Staff can create sales" ON sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pharmacist', 'staff')
    )
  );

-- Add more RLS policies as needed...

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('pharmacy_name', '"MediCare Pharmacy"', 'Name of the pharmacy'),
('pharmacy_address', '"123 Main Street, City, State - 123456"', 'Pharmacy address'),
('pharmacy_phone', '"1234567890"', 'Pharmacy contact number'),
('pharmacy_email', '"info@medicare.com"', 'Pharmacy email address'),
('pharmacy_gstin', '"22AAAAA0000A1Z5"', 'Pharmacy GSTIN number'),
('drug_license_number', '"DL-1234567890"', 'Drug license number'),
('pharmacy_state', '"Maharashtra"', 'Pharmacy state for GST calculation'),
('invoice_prefix', '"INV"', 'Invoice number prefix'),
('low_stock_threshold', '10', 'Default low stock threshold'),
('tax_settings', '{"cgst": 9, "sgst": 9, "igst": 18}', 'Default tax rates');

-- Create default admin user (run this after setting up Supabase Auth)
-- This should be done through the Supabase dashboard or auth API