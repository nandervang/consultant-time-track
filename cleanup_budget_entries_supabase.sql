-- Cleanup Budget Planning Entries from Cash Flow Table
-- Run this in Supabase SQL Editor to remove unwanted budget entries

-- 1. First, let's see what budget planning entries exist
SELECT 
  'Budget Planning Entries Found:' as status,
  COUNT(*) as total_count
FROM cash_flow_entries 
WHERE is_budget_entry = true;

-- 2. Show the actual budget entries that will be removed
SELECT 
  'Entries to be DELETED:' as action,
  id,
  description,
  amount,
  category,
  date,
  is_budget_entry
FROM cash_flow_entries 
WHERE is_budget_entry = true 
   OR description ILIKE '%budget%'
   OR description ILIKE '%årlig budget%'
ORDER BY description;

-- 3. Remove ALL budget planning entries from cash_flow_entries
-- These should NOT be in cash_flow - they're planning, not actual transactions
DELETE FROM cash_flow_entries 
WHERE is_budget_entry = true;

-- 4. Also remove any entries that look like budget planning (safety cleanup)
DELETE FROM cash_flow_entries 
WHERE description ILIKE '%årlig budget%'
   OR description ILIKE 'budget:%'
   OR (is_budget_entry IS NULL AND description ILIKE '%budget%');

-- 5. Verify cleanup - show remaining entries
SELECT 
  'Cleanup Complete - Remaining Entries:' as status,
  COUNT(*) as total_remaining,
  SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) as income_entries,
  SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) as expense_entries
FROM cash_flow_entries;

-- 6. Final verification - these should return 0 rows
SELECT 
  'Final Check - Budget Entries (should be 0):' as verification,
  COUNT(*) as budget_entries_remaining
FROM cash_flow_entries 
WHERE is_budget_entry = true;

-- 7. Show your clean actual transactions
SELECT 
  'Your Clean Cash Flow Entries:' as info,
  id,
  type,
  description,
  amount,
  category,
  date
FROM cash_flow_entries 
WHERE is_budget_entry = false OR is_budget_entry IS NULL
ORDER BY date DESC
LIMIT 10;

-- NOTE: Your budget limits remain safe in the 'budgets' table
-- This only removes duplicate/incorrect budget planning entries from cash_flow_entries