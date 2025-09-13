-- Database script to remove budget planning entries from cash flow
-- Keep only ACTUAL expenses and income, remove budget planning entries

-- 1. First, let's see what we have
SELECT 'Current Budget Entries in Cash Flow' as info,
       COUNT(*) as count
FROM cash_flow_entries 
WHERE is_budget_entry = true;

-- Show the budget entries that will be removed
SELECT 'Budget entries to be REMOVED:' as info, description, amount
FROM cash_flow_entries 
WHERE is_budget_entry = true
ORDER BY description;

-- 2. Remove budget planning entries from cash flow table
-- These should NOT be in cash flow - they're planning, not actual transactions
DELETE FROM cash_flow_entries 
WHERE is_budget_entry = true;

-- 3. Verify what remains (should be only actual transactions)
SELECT 'Remaining Cash Flow Entries After Cleanup' as info,
       COUNT(*) as count,
       SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) as income_count,
       SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) as expense_count
FROM cash_flow_entries;

-- 4. Show remaining entries to verify they're all actual transactions
SELECT 'Remaining entries (actual transactions only):' as info, 
       description, 
       amount, 
       type,
       date
FROM cash_flow_entries 
ORDER BY date DESC;

-- NOTE: Your budget limits are still preserved in the 'budgets' table
-- This cleanup only removes the duplicate budget "planning" entries from cash_flow_entries