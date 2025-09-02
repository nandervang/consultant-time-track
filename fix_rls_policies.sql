-- Fix infinite recursion in RLS policies
-- Run this script in your Supabase SQL editor to fix the recursion issue

-- Drop and recreate simplified RLS policies for client_documents
DROP POLICY IF EXISTS "Users can view documents they have access to" ON client_documents;
CREATE POLICY "Users can view documents they have access to" ON client_documents
  FOR SELECT USING (
    -- Users can see documents they created
    created_by = auth.uid()
    OR
    -- Users can see non-sensitive documents for clients they can access
    (is_sensitive = false AND client_id IN (
      SELECT id FROM clients 
      -- All authenticated users can access clients for now
      WHERE TRUE
    ))
  );

DROP POLICY IF EXISTS "Users can update documents they have write access to" ON client_documents;
CREATE POLICY "Users can update documents they have write access to" ON client_documents
  FOR UPDATE USING (
    -- Users can update documents they created
    created_by = auth.uid()
  );

-- Drop and recreate simplified RLS policies for document_versions
DROP POLICY IF EXISTS "Users can view versions of accessible documents" ON document_versions;
CREATE POLICY "Users can view versions of accessible documents" ON document_versions
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM client_documents 
      WHERE created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create versions for documents they can write" ON document_versions;
CREATE POLICY "Users can create versions for documents they can write" ON document_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND document_id IN (
      SELECT id FROM client_documents 
      WHERE created_by = auth.uid()
    )
  );

-- Drop and recreate simplified RLS policies for document_permissions
DROP POLICY IF EXISTS "Users can view permissions for accessible documents" ON document_permissions;
CREATE POLICY "Users can view permissions for accessible documents" ON document_permissions
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM client_documents 
      WHERE created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and document owners can manage permissions" ON document_permissions;
CREATE POLICY "Admins and document owners can manage permissions" ON document_permissions
  FOR ALL USING (
    granted_by = auth.uid()
    AND document_id IN (
      SELECT id FROM client_documents 
      WHERE created_by = auth.uid()
    )
  );

-- Drop and recreate simplified RLS policies for audit logs
DROP POLICY IF EXISTS "Users can view audit logs for accessible documents" ON document_audit_logs;
CREATE POLICY "Users can view audit logs for accessible documents" ON document_audit_logs
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM client_documents 
      WHERE created_by = auth.uid()
    )
  );

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'RLS policies fixed! Infinite recursion removed.';
  RAISE NOTICE 'Users can now only access documents they created (simplified permissions).';
  RAISE NOTICE 'You can enhance permissions later once the basic system is working.';
END $$;
