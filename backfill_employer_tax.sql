-- Backfill employer tax entries for existing scheduled salary payments
-- Run this SQL in your Supabase SQL editor AFTER running add_salary_payments_columns.sql

-- This script will create employer tax cash flow entries for all existing scheduled salary payments
-- where the user has auto_generate_employer_tax enabled

DO $$
DECLARE
    salary_record RECORD;
    user_settings RECORD;
    employer_tax_amount DECIMAL(10,2);
    tax_payment_date DATE;
    tax_year INTEGER;
    tax_month INTEGER;
    employer_tax_entry_id UUID;
    employer_tax_uuid UUID;
    employee_name TEXT;
BEGIN
    -- Loop through all scheduled salary payments that don't have employer tax entries
    FOR salary_record IN 
        SELECT sp.*, se.name as employee_name, se.position as employee_position
        FROM salary_payments sp
        JOIN salary_employees se ON sp.employee_id = se.id
        WHERE sp.status = 'scheduled' 
        AND sp.total_amount > 0
        AND (sp.employer_tax_entry_id IS NULL OR sp.employer_tax_entry_id IS NOT NULL)  -- Get all for now
    LOOP
        -- Skip if employer tax entry already exists
        IF salary_record.employer_tax_entry_id IS NOT NULL THEN
            CONTINUE;
        END IF;
        
        -- Get user settings for this salary payment
        SELECT auto_generate_employer_tax, employer_tax_payment_date
        INTO user_settings
        FROM user_profiles 
        WHERE id = salary_record.user_id;
        
        -- Only process if user has employer tax auto-generation enabled
        IF user_settings.auto_generate_employer_tax THEN
            -- Calculate employer tax amount (31.42%)
            employer_tax_amount := ROUND(salary_record.total_amount * 0.3142, 2);
            
            -- Calculate tax payment date (month AFTER salary)
            tax_year := salary_record.year;
            tax_month := salary_record.month + 1;
            
            -- Handle year rollover
            IF tax_month > 12 THEN
                tax_month := 1;
                tax_year := tax_year + 1;
            END IF;
            
            -- Create tax payment date (handle month-end edge cases)
            tax_payment_date := MAKE_DATE(
                tax_year, 
                tax_month, 
                LEAST(
                    COALESCE(user_settings.employer_tax_payment_date, 25),
                    EXTRACT(DAY FROM (MAKE_DATE(tax_year, tax_month, 1) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER
                )
            );
            
            -- Create employer tax cash flow entry
            INSERT INTO cash_flow_entries (
                user_id,
                type,
                amount,
                description,
                category,
                date,
                is_recurring,
                is_budget_entry,
                is_recurring_instance
            ) VALUES (
                salary_record.user_id,
                'expense',
                employer_tax_amount,
                'Employer Tax - ' || salary_record.employee_name || COALESCE(' (' || salary_record.employee_position || ')', ''),
                'Employer Tax',
                tax_payment_date,
                false,
                false,
                false
            ) RETURNING id INTO employer_tax_uuid;
            
            -- Update salary payment with employer tax reference
            UPDATE salary_payments 
            SET employer_tax_entry_id = employer_tax_uuid
            WHERE id = salary_record.id;
            
            RAISE NOTICE 'Created employer tax entry for % (%) - Amount: %, Date: %', 
                salary_record.employee_name,
                salary_record.year || '-' || LPAD(salary_record.month::TEXT, 2, '0'),
                employer_tax_amount,
                tax_payment_date;
        END IF;
    END LOOP;
END $$;

-- Verify the results
SELECT 
    'Backfill Results' as result_type,
    COUNT(*) as total_scheduled_salaries,
    COUNT(employer_tax_entry_id) as salaries_with_employer_tax,
    COUNT(*) - COUNT(employer_tax_entry_id) as missing_employer_tax
FROM salary_payments 
WHERE status = 'scheduled' AND total_amount > 0;

-- Show recent employer tax entries created
SELECT 
    'Recent Employer Tax Entries' as result_type,
    id,
    amount,
    description,
    date,
    created_at
FROM cash_flow_entries 
WHERE category = 'Employer Tax'
ORDER BY created_at DESC
LIMIT 10;