-- Pharmacy ERP Safe Seed Data
-- This file can be run multiple times safely without errors
-- It will only insert data that doesn't already exist

-- Clear existing seed data (optional - uncomment if you want to reset)
-- DELETE FROM stock_movements WHERE reason = 'Initial stock - seed data';
-- DELETE FROM medicine_batches WHERE batch_number LIKE 'BATCH-%';
-- DELETE FROM medicines WHERE name IN ('Paracetamol 500mg', 'Amoxicillin 500mg', 'Aspirin 75mg');
-- DELETE FROM customers WHERE patient_id LIKE 'P00%';
-- DELETE FROM retailers WHERE business_name IN ('City Medical Store', 'Health Plus Pharmacy', 'Care Point Medical');
-- DELETE FROM wholesalers WHERE business_name IN ('MediSupply Co.', 'HealthCare Distributors', 'PharmaLink Ltd.');

-- Insert sample settings (update if exists)
INSERT INTO settings (key, value, description) VALUES
('pharmacy_name', '"MediCare Pharmacy"', 'Name of the pharmacy'),
('pharmacy_address', '"123 Main Street, Medical District, City, State - 123456"', 'Pharmacy address'),
('pharmacy_phone', '"+91 98765 43210"', 'Pharmacy contact number'),
('pharmacy_email', '"info@medicare.com"', 'Pharmacy email address'),
('pharmacy_gstin', '"22AAAAA0000A1Z5"', 'Pharmacy GSTIN number'),
('drug_license_number', '"DL-1234567890"', 'Drug license number'),
('pharmacy_state', '"Maharashtra"', 'Pharmacy state for GST calculation'),
('invoice_prefix', '"INV"', 'Invoice number prefix'),
('low_stock_threshold', '10', 'Default low stock threshold'),
('tax_settings', '{"cgst": 9, "sgst": 9, "igst": 18}', 'Default tax rates')
ON CONFLICT (key) DO UPDATE SET
value = EXCLUDED.value,
description = EXCLUDED.description,
updated_at = NOW();

-- Sample wholesalers/suppliers (only insert if not exists)
INSERT INTO wholesalers (business_name, owner_name, phone, email, address, city, state, pincode, gstin, drug_license_number, drug_license_expiry, pan, credit_limit, payment_terms) 
SELECT * FROM (VALUES
('MediSupply Co.', 'Rajesh Sharma', '9876543200', 'rajesh@medisupply.com', '456 Industrial Area', 'Mumbai', 'Maharashtra', '400001', '27AAAAA0000A1Z5', 'DL-WS-001', '2025-12-31'::date, 'AAAAA0000A', 500000.00, 30),
('HealthCare Distributors', 'Priya Patel', '9876543201', 'priya@healthcare.com', '789 Commercial Street', 'Pune', 'Maharashtra', '411001', '27BBBBB0000B1Z5', 'DL-WS-002', '2025-11-30'::date, 'BBBBB0000B', 750000.00, 45),
('PharmaLink Ltd.', 'Amit Kumar', '9876543202', 'amit@pharmalink.com', '321 Trade Center', 'Nashik', 'Maharashtra', '422001', '27CCCCC0000C1Z5', 'DL-WS-003', '2026-01-15'::date, 'CCCCC0000C', 1000000.00, 60)
) AS new_data(business_name, owner_name, phone, email, address, city, state, pincode, gstin, drug_license_number, drug_license_expiry, pan, credit_limit, payment_terms)
WHERE NOT EXISTS (
    SELECT 1 FROM wholesalers w WHERE w.business_name = new_data.business_name
);

-- Sample retailers (only insert if not exists)
INSERT INTO retailers (business_name, owner_name, phone, email, address, state, gstin, drug_license_number, drug_license_expiry, credit_limit, payment_terms)
SELECT * FROM (VALUES
('City Medical Store', 'Suresh Gupta', '9876543210', 'suresh@citymedical.com', '123 Main Road, City Center', 'Maharashtra', '27DDDDD0000D1Z5', 'DL-RT-001', '2025-10-31'::date, 100000.00, 15),
('Health Plus Pharmacy', 'Meera Singh', '9876543211', 'meera@healthplus.com', '456 Shopping Complex', 'Maharashtra', '27EEEEE0000E1Z5', 'DL-RT-002', '2025-12-15'::date, 150000.00, 30),
('Care Point Medical', 'Ravi Joshi', '9876543212', 'ravi@carepoint.com', '789 Medical Square', 'Maharashtra', '27FFFFF0000F1Z5', 'DL-RT-003', '2026-02-28'::date, 200000.00, 20)
) AS new_data(business_name, owner_name, phone, email, address, state, gstin, drug_license_number, drug_license_expiry, credit_limit, payment_terms)
WHERE NOT EXISTS (
    SELECT 1 FROM retailers r WHERE r.business_name = new_data.business_name
);

-- Sample customers (only insert if not exists)
INSERT INTO customers (name, phone, email, address, date_of_birth, gender, patient_id, emergency_contact)
SELECT * FROM (VALUES
('Rahul Sharma', '9876543220', 'rahul@email.com', '123 Residential Area', '1985-06-15'::date, 'male', 'P001', '9876543221'),
('Sunita Patel', '9876543222', 'sunita@email.com', '456 Housing Society', '1990-03-20'::date, 'female', 'P002', '9876543223'),
('Vikram Singh', '9876543224', 'vikram@email.com', '789 Apartment Complex', '1978-11-10'::date, 'male', 'P003', '9876543225'),
('Kavya Reddy', '9876543226', 'kavya@email.com', '321 Villa Gardens', '1992-08-05'::date, 'female', 'P004', '9876543227'),
('Arjun Nair', '9876543228', 'arjun@email.com', '654 Colony Road', '1987-12-25'::date, 'male', 'P005', '9876543229')
) AS new_data(name, phone, email, address, date_of_birth, gender, patient_id, emergency_contact)
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.patient_id = new_data.patient_id
);

-- Sample medicines (only insert if not exists)
INSERT INTO medicines (name, generic_name, brand, manufacturer, category, composition, dosage_form, strength, hsn_code, gst_percentage, prescription_required, description, low_stock_threshold)
SELECT * FROM (VALUES
('Paracetamol 500mg', 'Paracetamol', 'Crocin', 'GSK', 'Pain Relief', 'Paracetamol 500mg', 'Tablet', '500mg', '30049099', 12.00, false, 'Pain reliever and fever reducer', 50),
('Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', 'Cipla', 'Antibiotics', 'Amoxicillin Trihydrate 500mg', 'Capsule', '500mg', '30049099', 12.00, true, 'Antibiotic for bacterial infections', 30),
('Aspirin 75mg', 'Aspirin', 'Dispirin', 'Reckitt Benckiser', 'Cardiovascular', 'Acetylsalicylic Acid 75mg', 'Tablet', '75mg', '30049099', 12.00, false, 'Blood thinner and pain reliever', 40),
('Metformin 500mg', 'Metformin HCl', 'Glycomet', 'USV', 'Diabetes', 'Metformin Hydrochloride 500mg', 'Tablet', '500mg', '30049099', 12.00, true, 'Diabetes medication', 25),
('Ibuprofen 400mg', 'Ibuprofen', 'Brufen', 'Abbott', 'Pain Relief', 'Ibuprofen 400mg', 'Tablet', '400mg', '30049099', 12.00, false, 'Anti-inflammatory pain reliever', 35),
('Cetirizine 10mg', 'Cetirizine HCl', 'Zyrtec', 'UCB', 'Antihistamine', 'Cetirizine Hydrochloride 10mg', 'Tablet', '10mg', '30049099', 12.00, false, 'Allergy medication', 45),
('Omeprazole 20mg', 'Omeprazole', 'Prilosec', 'AstraZeneca', 'Gastrointestinal', 'Omeprazole 20mg', 'Capsule', '20mg', '30049099', 12.00, false, 'Acid reflux medication', 30),
('Vitamin D3 1000 IU', 'Cholecalciferol', 'Calcirol', 'Cadila', 'Vitamins', 'Cholecalciferol 1000 IU', 'Tablet', '1000 IU', '30049099', 5.00, false, 'Vitamin D supplement', 60)
) AS new_data(name, generic_name, brand, manufacturer, category, composition, dosage_form, strength, hsn_code, gst_percentage, prescription_required, description, low_stock_threshold)
WHERE NOT EXISTS (
    SELECT 1 FROM medicines m WHERE m.name = new_data.name
);

-- Sample medicine batches (only insert if medicines exist and batches don't exist)
DO $$
DECLARE 
    medicine_rec RECORD;
    supplier_id_val UUID;
    batch_counter INTEGER := 1;
BEGIN
    -- Get a random supplier ID
    SELECT id INTO supplier_id_val FROM wholesalers ORDER BY RANDOM() LIMIT 1;
    
    -- Loop through medicines and create batches
    FOR medicine_rec IN 
        SELECT id, name, gst_percentage 
        FROM medicines 
        WHERE name IN ('Paracetamol 500mg', 'Amoxicillin 500mg', 'Aspirin 75mg', 'Metformin 500mg', 'Ibuprofen 400mg', 'Cetirizine 10mg', 'Omeprazole 20mg', 'Vitamin D3 1000 IU')
    LOOP
        -- Only insert batch if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM medicine_batches 
            WHERE medicine_id = medicine_rec.id 
            AND batch_number = 'BATCH-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(batch_counter::text, 4, '0')
        ) THEN
            INSERT INTO medicine_batches (
                medicine_id, batch_number, manufacturing_date, expiry_date, 
                purchase_price, mrp, selling_price, wholesale_price, gst_percentage, 
                initial_quantity, current_quantity, free_quantity, rack_location, supplier_id
            ) VALUES (
                medicine_rec.id,
                'BATCH-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(batch_counter::text, 4, '0'),
                CURRENT_DATE - INTERVAL '30 days',
                CURRENT_DATE + INTERVAL '24 months',
                CASE 
                    WHEN medicine_rec.name LIKE '%Paracetamol%' THEN 2.50
                    WHEN medicine_rec.name LIKE '%Amoxicillin%' THEN 8.00
                    WHEN medicine_rec.name LIKE '%Aspirin%' THEN 1.80
                    WHEN medicine_rec.name LIKE '%Metformin%' THEN 3.20
                    WHEN medicine_rec.name LIKE '%Ibuprofen%' THEN 4.50
                    WHEN medicine_rec.name LIKE '%Cetirizine%' THEN 2.80
                    WHEN medicine_rec.name LIKE '%Omeprazole%' THEN 6.20
                    WHEN medicine_rec.name LIKE '%Vitamin D3%' THEN 5.50
                    ELSE 5.00
                END,
                CASE 
                    WHEN medicine_rec.name LIKE '%Paracetamol%' THEN 5.00
                    WHEN medicine_rec.name LIKE '%Amoxicillin%' THEN 15.00
                    WHEN medicine_rec.name LIKE '%Aspirin%' THEN 3.50
                    WHEN medicine_rec.name LIKE '%Metformin%' THEN 6.00
                    WHEN medicine_rec.name LIKE '%Ibuprofen%' THEN 8.50
                    WHEN medicine_rec.name LIKE '%Cetirizine%' THEN 5.20
                    WHEN medicine_rec.name LIKE '%Omeprazole%' THEN 12.00
                    WHEN medicine_rec.name LIKE '%Vitamin D3%' THEN 10.50
                    ELSE 10.00
                END,
                CASE 
                    WHEN medicine_rec.name LIKE '%Paracetamol%' THEN 4.50
                    WHEN medicine_rec.name LIKE '%Amoxicillin%' THEN 13.50
                    WHEN medicine_rec.name LIKE '%Aspirin%' THEN 3.15
                    WHEN medicine_rec.name LIKE '%Metformin%' THEN 5.40
                    WHEN medicine_rec.name LIKE '%Ibuprofen%' THEN 7.65
                    WHEN medicine_rec.name LIKE '%Cetirizine%' THEN 4.68
                    WHEN medicine_rec.name LIKE '%Omeprazole%' THEN 10.80
                    WHEN medicine_rec.name LIKE '%Vitamin D3%' THEN 9.45
                    ELSE 9.00
                END,
                CASE 
                    WHEN medicine_rec.name LIKE '%Paracetamol%' THEN 3.00
                    WHEN medicine_rec.name LIKE '%Amoxicillin%' THEN 10.00
                    WHEN medicine_rec.name LIKE '%Aspirin%' THEN 2.20
                    WHEN medicine_rec.name LIKE '%Metformin%' THEN 4.00
                    WHEN medicine_rec.name LIKE '%Ibuprofen%' THEN 5.50
                    WHEN medicine_rec.name LIKE '%Cetirizine%' THEN 3.50
                    WHEN medicine_rec.name LIKE '%Omeprazole%' THEN 7.50
                    WHEN medicine_rec.name LIKE '%Vitamin D3%' THEN 6.50
                    ELSE 6.00
                END,
                medicine_rec.gst_percentage,
                CASE 
                    WHEN medicine_rec.name LIKE '%Paracetamol%' THEN 500
                    WHEN medicine_rec.name LIKE '%Amoxicillin%' THEN 200
                    WHEN medicine_rec.name LIKE '%Aspirin%' THEN 300
                    WHEN medicine_rec.name LIKE '%Metformin%' THEN 150
                    WHEN medicine_rec.name LIKE '%Ibuprofen%' THEN 250
                    WHEN medicine_rec.name LIKE '%Cetirizine%' THEN 400
                    WHEN medicine_rec.name LIKE '%Omeprazole%' THEN 180
                    WHEN medicine_rec.name LIKE '%Vitamin D3%' THEN 350
                    ELSE 200
                END,
                CASE 
                    WHEN medicine_rec.name LIKE '%Paracetamol%' THEN 450
                    WHEN medicine_rec.name LIKE '%Amoxicillin%' THEN 180
                    WHEN medicine_rec.name LIKE '%Aspirin%' THEN 280
                    WHEN medicine_rec.name LIKE '%Metformin%' THEN 140
                    WHEN medicine_rec.name LIKE '%Ibuprofen%' THEN 230
                    WHEN medicine_rec.name LIKE '%Cetirizine%' THEN 380
                    WHEN medicine_rec.name LIKE '%Omeprazole%' THEN 160
                    WHEN medicine_rec.name LIKE '%Vitamin D3%' THEN 330
                    ELSE 180
                END,
                0,
                'A' || batch_counter,
                supplier_id_val
            );
            
            -- Create initial stock movement
            INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reason)
            VALUES (
                medicine_rec.id,
                (SELECT id FROM medicine_batches WHERE batch_number = 'BATCH-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(batch_counter::text, 4, '0')),
                'purchase',
                CASE 
                    WHEN medicine_rec.name LIKE '%Paracetamol%' THEN 500
                    WHEN medicine_rec.name LIKE '%Amoxicillin%' THEN 200
                    WHEN medicine_rec.name LIKE '%Aspirin%' THEN 300
                    WHEN medicine_rec.name LIKE '%Metformin%' THEN 150
                    WHEN medicine_rec.name LIKE '%Ibuprofen%' THEN 250
                    WHEN medicine_rec.name LIKE '%Cetirizine%' THEN 400
                    WHEN medicine_rec.name LIKE '%Omeprazole%' THEN 180
                    WHEN medicine_rec.name LIKE '%Vitamin D3%' THEN 350
                    ELSE 200
                END,
                'purchase',
                'Initial stock - seed data'
            );
        END IF;
        
        batch_counter := batch_counter + 1;
    END LOOP;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- % wholesalers', (SELECT COUNT(*) FROM wholesalers);
    RAISE NOTICE '- % retailers', (SELECT COUNT(*) FROM retailers);
    RAISE NOTICE '- % customers', (SELECT COUNT(*) FROM customers);
    RAISE NOTICE '- % medicines', (SELECT COUNT(*) FROM medicines);
    RAISE NOTICE '- % medicine batches', (SELECT COUNT(*) FROM medicine_batches);
    RAISE NOTICE '- % stock movements', (SELECT COUNT(*) FROM stock_movements);
    RAISE NOTICE 'You can now test the application with sample data!';
END $$;