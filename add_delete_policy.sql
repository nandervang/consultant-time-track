-- Add proper DELETE policy for client_documents
-- Run this in your Supabase SQL editor

-- Drop existing delete policy if exists
DROP POLICY IF EXISTS "Users can delete documents they created" ON client_documents;

-- Create a proper delete policy - users can delete documents they created
CREATE POLICY "Users can delete documents they created" ON client_documents
  FOR DELETE USING (created_by = auth.uid());

-- Also add a more permissive policy for admins if needed
-- (You can uncomment this if you want admins to be able to delete any document)
-- CREATE POLICY "Admins can delete any document" ON client_documents
--   FOR DELETE USING (
--     auth.uid() IN (
--       SELECT user_id FROM user_profiles 
--       WHERE role = 'admin' OR role = 'super_admin'
--     )
--   );

-- Success message
SELECT 'DELETE policy added - users can now delete documents they created' as message;

-- Test the policy by checking if it was created
SELECT 
  schemaname,
  tablename, 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'client_documents' AND cmd = 'DELETE';
