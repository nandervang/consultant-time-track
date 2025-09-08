-- Fix the audit log trigger to handle document deletions properly
-- Run this in your Supabase SQL editor

-- Drop the existing trigger
DROP TRIGGER IF EXISTS log_client_document_action ON client_documents;

-- Recreate the log_document_action function with better delete handling
CREATE OR REPLACE FUNCTION log_document_action()
RETURNS TRIGGER AS $$
BEGIN
  -- For DELETE operations, log BEFORE the actual deletion
  IF TG_OP = 'DELETE' THEN
    INSERT INTO document_audit_logs (
      document_id,
      user_id,
      action,
      details
    ) VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      jsonb_build_object('title', OLD.title, 'type', OLD.document_type)
    );
    RETURN OLD;
  END IF;
  
  -- For INSERT and UPDATE, log normally
  INSERT INTO document_audit_logs (
    document_id,
    user_id,
    action,
    details
  ) VALUES (
    NEW.id,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('title', NEW.title, 'type', NEW.document_type)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old_title', OLD.title, 'new_title', NEW.title)
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with BEFORE DELETE instead of AFTER DELETE
CREATE TRIGGER log_client_document_action
  BEFORE DELETE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_action();

-- Also create separate triggers for INSERT and UPDATE to maintain logging
CREATE TRIGGER log_client_document_action_insert_update
  AFTER INSERT OR UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_action();

-- Alternative approach: Remove the foreign key constraint from audit logs
-- (Uncomment these lines if you prefer to keep audit logs even after document deletion)
/*
ALTER TABLE document_audit_logs 
DROP CONSTRAINT IF EXISTS document_audit_logs_document_id_fkey;

-- Add a new constraint that allows NULL document_id or existing document_id
ALTER TABLE document_audit_logs 
ADD CONSTRAINT document_audit_logs_document_id_fkey 
FOREIGN KEY (document_id) REFERENCES client_documents(id) 
ON DELETE SET NULL;
*/

-- Success message
SELECT 'Audit log trigger fixed - document deletion should now work' as message;

-- Test by checking existing triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'client_documents'
ORDER BY trigger_name;
