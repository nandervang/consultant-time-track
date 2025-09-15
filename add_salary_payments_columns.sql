-- Add missing columns to salary_payments table for employer tax functionality
-- Run this SQL in your Supabase SQL editor BEFORE running the backfill script

-- Add the missing columns to salary_payments table
ALTER TABLE public.salary_payments 
ADD COLUMN IF NOT EXISTS cash_flow_entry_id UUID REFERENCES public.cash_flow_entries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS employer_tax_entry_id UUID REFERENCES public.cash_flow_entries(id) ON DELETE SET NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.salary_payments.cash_flow_entry_id IS 'Reference to the salary cash flow entry';
COMMENT ON COLUMN public.salary_payments.employer_tax_entry_id IS 'Reference to the employer tax cash flow entry';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salary_payments_cash_flow_entry_id ON public.salary_payments(cash_flow_entry_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_employer_tax_entry_id ON public.salary_payments(employer_tax_entry_id);

-- Verify the new columns exist
SELECT 
    'Salary Payments Columns Check' as check_type,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salary_payments' 
AND table_schema = 'public'
AND column_name IN ('cash_flow_entry_id', 'employer_tax_entry_id')
ORDER BY column_name;