-- Check current MOMS Tax entries in database
SELECT 
    id,
    category,
    description,
    amount,
    date,
    created_at
FROM cash_flow_entries 
WHERE category = 'MOMS Tax'
ORDER BY date DESC, created_at DESC;