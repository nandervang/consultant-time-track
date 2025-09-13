-- Database script to fix cash flow system issues

-- 1. Update some invoice statuses to 'sent' so they appear in cash flow
-- This will help test the invoice integration
UPDATE invoice_items 
SET status = 'sent' 
WHERE id IN (
  '47c4a97f-de38-4f77-8121-9cb7714c3821', -- Del 1 - due 2025-09-28
  '032c4878-37e7-4aa2-aaf5-e09bc4ae0607', -- kv1 del 1 - due 2025-11-28
  '3bd589e0-6acb-4a99-be58-412845b12d84', -- Aktivitet datumspann - due 2025-10-29
  '72fee3a1-1b85-43b6-ac72-6bbc8936f704', -- Feedback justeringar - due 2025-10-29
  '39a91f74-eedd-4f40-84fc-3efdcf98c731'  -- Ändringar för knappar - due 2025-10-29
)
AND due_date IS NOT NULL;

-- 2. Verify the budget entries are correctly marked as recurring
-- Budget entries should be recurring so they appear in all months
UPDATE cash_flow_entries 
SET is_recurring = true,
    recurring_interval = 'monthly'
WHERE is_budget_entry = true 
  AND is_recurring = false;

-- Verify yearly budget entries
UPDATE cash_flow_entries 
SET recurring_interval = 'yearly'
WHERE is_budget_entry = true 
  AND (description LIKE '%Årlig budget%' OR description LIKE '%årlig%');

-- 3. Check current data status
SELECT 'Cash Flow Budget Entries' as type, 
       COUNT(*) as count,
       COUNT(CASE WHEN is_recurring = true THEN 1 END) as recurring_count
FROM cash_flow_entries 
WHERE is_budget_entry = true;

SELECT 'Invoice Items Ready for Cash Flow' as type,
       COUNT(*) as count
FROM invoice_items 
WHERE status IN ('sent', 'overdue', 'paid') 
  AND due_date IS NOT NULL;

SELECT 'Manual Cash Flow Entries' as type,
       COUNT(*) as count  
FROM cash_flow_entries 
WHERE is_budget_entry = false OR is_budget_entry IS NULL;