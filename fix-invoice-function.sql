-- Fix for invoice number generation function
-- Run this on your Supabase database to fix the ambiguous column reference error

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_invoice_number TEXT;
BEGIN
  -- Get the next invoice number with explicit table alias
  SELECT COALESCE(MAX(CAST(SUBSTRING(s.invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM sales s
  WHERE s.invoice_number ~ '^INV-\d{4}-\d+$'
    AND EXTRACT(YEAR FROM s.created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format the invoice number
  new_invoice_number := 'INV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_number::TEXT, 8, '0');
  
  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;
