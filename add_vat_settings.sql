-- Add Swedish MOMS (VAT) settings columns to user_profiles table
-- Run this SQL in your Supabase SQL editor to enable VAT functionality

-- Add the missing columns to user_profiles table for VAT management
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS auto_generate_yearly_vat BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vat_rate_income DECIMAL(5,2) DEFAULT 25.0 CHECK (vat_rate_income >= 0 AND vat_rate_income <= 100),
ADD COLUMN IF NOT EXISTS vat_rate_expense DECIMAL(5,2) DEFAULT 25.0 CHECK (vat_rate_expense >= 0 AND vat_rate_expense <= 100),
ADD COLUMN IF NOT EXISTS vat_payment_month INTEGER DEFAULT 1 CHECK (vat_payment_month >= 1 AND vat_payment_month <= 12),
ADD COLUMN IF NOT EXISTS vat_payment_day INTEGER DEFAULT 12 CHECK (vat_payment_day >= 1 AND vat_payment_day <= 31);

-- Add comments for clarity
COMMENT ON COLUMN public.user_profiles.auto_generate_yearly_vat IS 'Whether to automatically generate yearly VAT (MOMS) payment calculations';
COMMENT ON COLUMN public.user_profiles.vat_rate_income IS 'VAT rate to add to invoice income (default 25% for Swedish MOMS)';
COMMENT ON COLUMN public.user_profiles.vat_rate_expense IS 'VAT rate included in expenses (default 25% for Swedish MOMS)';
COMMENT ON COLUMN public.user_profiles.vat_payment_month IS 'Month when yearly VAT should be calculated and paid (1-12)';
COMMENT ON COLUMN public.user_profiles.vat_payment_day IS 'Day of the month when yearly VAT should be paid (1-31)';

-- Add columns to cash_flow_entries to track VAT components
ALTER TABLE public.cash_flow_entries
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_excluding_vat DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 0;

-- Add comments for VAT tracking
COMMENT ON COLUMN public.cash_flow_entries.vat_amount IS 'VAT amount for this entry (positive for income VAT, negative for reclaimable expense VAT)';
COMMENT ON COLUMN public.cash_flow_entries.amount_excluding_vat IS 'Amount excluding VAT';
COMMENT ON COLUMN public.cash_flow_entries.vat_rate IS 'VAT rate used for this entry';

-- Create indexes for VAT calculations
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_vat_amount ON public.cash_flow_entries(vat_amount);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_vat_date ON public.cash_flow_entries(date, vat_amount) WHERE vat_amount != 0;

-- Verify the new columns exist
SELECT 
    'VAT Settings Columns Check' as check_type,
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
AND column_name IN ('auto_generate_yearly_vat', 'vat_rate_income', 'vat_rate_expense', 'vat_payment_month', 'vat_payment_day')
ORDER BY column_name;

SELECT 
    'Cash Flow VAT Columns Check' as check_type,
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cash_flow_entries' 
AND table_schema = 'public'
AND column_name IN ('vat_amount', 'amount_excluding_vat', 'vat_rate')
ORDER BY column_name;