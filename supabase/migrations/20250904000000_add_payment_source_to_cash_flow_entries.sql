-- Add payment_source column to cash_flow_entries table
ALTER TABLE cash_flow_entries 
ADD COLUMN payment_source text CHECK (payment_source IN ('Privat utlägg', 'Mynt kortet', 'Faktura', 'Annat')) DEFAULT 'Privat utlägg';

-- Update existing entries to have default payment source
UPDATE cash_flow_entries 
SET payment_source = 'Privat utlägg' 
WHERE payment_source IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN cash_flow_entries.payment_source IS 'Payment source for expenses: Privat utlägg (Private expense), Mynt kortet (Mynt card), Faktura (Invoice), Annat (Other)';
