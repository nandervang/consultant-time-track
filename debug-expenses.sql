-- Supabase SQL Script to Debug Budget Expenses
-- Run this in your Supabase SQL Editor

-- 1. Check total expense count
SELECT 
  'Total Expenses' as metric,
  COUNT(*) as count
FROM cash_flow_entries 
WHERE type = 'expense';

-- 2. Check recent expenses (last 10)
SELECT 
  date,
  category,
  description,
  amount,
  is_budget_entry,
  is_recurring
FROM cash_flow_entries 
WHERE type = 'expense'
ORDER BY date DESC 
LIMIT 10;

-- 3. Check current month expenses (September 2025)
SELECT 
  date,
  category,
  description,
  amount,
  is_budget_entry
FROM cash_flow_entries 
WHERE type = 'expense'
  AND date >= '2025-09-01'
  AND date < '2025-10-01'
ORDER BY date DESC;

-- 4. Check current year expenses (2025)
SELECT 
  date,
  category,
  description,
  amount,
  is_budget_entry
FROM cash_flow_entries 
WHERE type = 'expense'
  AND date >= '2025-01-01'
  AND date < '2026-01-01'
ORDER BY date DESC;

-- 5. Check all budget categories
SELECT 
  id,
  name,
  category,
  budget_limit,
  period,
  is_active,
  created_at
FROM budgets
ORDER BY created_at DESC;

-- 6. Monthly expenses grouped by category (September 2025)
SELECT 
  category,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount
FROM cash_flow_entries 
WHERE type = 'expense'
  AND date >= '2025-09-01'
  AND date < '2025-10-01'
GROUP BY category
ORDER BY total_amount DESC;

-- 7. Annual expenses grouped by category (2025)
SELECT 
  category,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount
FROM cash_flow_entries 
WHERE type = 'expense'
  AND date >= '2025-01-01'
  AND date < '2026-01-01'
GROUP BY category
ORDER BY total_amount DESC;

-- 8. Check for expenses that might match budget categories
SELECT DISTINCT
  b.name as budget_name,
  b.category as budget_category,
  b.period,
  e.category as expense_category,
  COUNT(e.id) as matching_expenses,
  SUM(e.amount) as total_spent
FROM budgets b
LEFT JOIN cash_flow_entries e ON (
  e.type = 'expense' 
  AND (
    LOWER(e.category) = LOWER(b.category) 
    OR LOWER(e.category) LIKE LOWER(b.category) || '%'
    OR LOWER(b.category) LIKE LOWER(e.category) || '%'
  )
  AND (
    (b.period = 'monthly' AND e.date >= '2025-09-01' AND e.date < '2025-10-01')
    OR (b.period = 'yearly' AND e.date >= '2025-01-01' AND e.date < '2026-01-01')
  )
)
GROUP BY b.id, b.name, b.category, b.period, e.category
ORDER BY b.name, e.category;

-- 9. Check for orphaned expenses (not matching any budget)
SELECT 
  e.date,
  e.category,
  e.description,
  e.amount
FROM cash_flow_entries e
WHERE e.type = 'expense'
  AND NOT EXISTS (
    SELECT 1 FROM budgets b 
    WHERE LOWER(e.category) = LOWER(b.category) 
       OR LOWER(e.category) LIKE LOWER(b.category) || '%'
       OR LOWER(b.category) LIKE LOWER(e.category) || '%'
  )
ORDER BY e.date DESC
LIMIT 20;

-- 10. Summary report
SELECT 
  'Budget Categories' as type,
  COUNT(*) as count
FROM budgets
WHERE is_active = true

UNION ALL

SELECT 
  'Total Expenses (All Time)' as type,
  COUNT(*) as count
FROM cash_flow_entries 
WHERE type = 'expense'

UNION ALL

SELECT 
  'September 2025 Expenses' as type,
  COUNT(*) as count
FROM cash_flow_entries 
WHERE type = 'expense'
  AND date >= '2025-09-01'
  AND date < '2025-10-01'

UNION ALL

SELECT 
  'Year 2025 Expenses' as type,
  COUNT(*) as count
FROM cash_flow_entries 
WHERE type = 'expense'
  AND date >= '2025-01-01'
  AND date < '2026-01-01';
