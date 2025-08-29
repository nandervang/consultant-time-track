-- Step 2: Check what clients exist
SELECT id, name, company, user_id, created_at
FROM clients 
ORDER BY created_at DESC;
