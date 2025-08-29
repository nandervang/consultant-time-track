-- Step 3: Check what projects exist and their client relationships
SELECT 
  p.id,
  p.name as project_name,
  p.color,
  p.client_id,
  p.status,
  p.user_id,
  p.created_at,
  c.name as client_name
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.created_at DESC;
