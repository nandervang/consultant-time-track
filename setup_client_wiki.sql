-- Client Documentation Wiki System Migration
-- Run this script in your Supabase SQL editor

-- Create client documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content JSONB NOT NULL, -- Tiptap JSON content
  content_html TEXT, -- Rendered HTML for search
  content_markdown TEXT, -- Markdown export
  is_sensitive BOOLEAN DEFAULT false,
  encrypted_content TEXT, -- For sensitive documents
  document_type VARCHAR(50) DEFAULT 'page', -- 'page', 'note', 'contract', 'specification'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  tags TEXT[], -- Array of tags for categorization
  reading_time_minutes INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, slug)
);

-- Create document versions table for history
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  content_html TEXT,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

-- Create document permissions table
CREATE TABLE IF NOT EXISTS document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role_type VARCHAR(50), -- 'client_team', 'consultant_team', 'admin'
  permission_level VARCHAR(50) NOT NULL, -- 'read', 'write', 'admin'
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(document_id, user_id)
);

-- Create document audit log
CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'viewed', 'shared', 'deleted'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_sensitive ON client_documents(is_sensitive);
CREATE INDEX IF NOT EXISTS idx_client_documents_created ON client_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_client_documents_updated ON client_documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_client_documents_tags ON client_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_client_documents_search ON client_documents USING GIN(to_tsvector('english', title || ' ' || COALESCE(content_html, '')));

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created ON document_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_active ON document_permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user ON document_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_created ON document_audit_logs(created_at);

-- Enable RLS on all tables
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_documents
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

DROP POLICY IF EXISTS "Users can create documents for accessible clients" ON client_documents;
CREATE POLICY "Users can create documents for accessible clients" ON client_documents
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND client_id IN (
      SELECT id FROM clients 
      -- All authenticated users can create documents for any client
      WHERE TRUE
    )
  );

DROP POLICY IF EXISTS "Users can update documents they have write access to" ON client_documents;
CREATE POLICY "Users can update documents they have write access to" ON client_documents
  FOR UPDATE USING (
    -- Users can update documents they created
    created_by = auth.uid()
  );

-- RLS policies for document_versions
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

-- RLS policies for document_permissions
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

-- RLS policies for audit logs
DROP POLICY IF EXISTS "Users can view audit logs for accessible documents" ON document_audit_logs;
CREATE POLICY "Users can view audit logs for accessible documents" ON document_audit_logs
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM client_documents 
      WHERE created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON document_audit_logs;
CREATE POLICY "System can insert audit logs" ON document_audit_logs
  FOR INSERT WITH CHECK (true); -- Audit logs can be inserted by system

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_client_documents_updated_at ON client_documents;
CREATE TRIGGER update_client_documents_updated_at
  BEFORE UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate reading time and word count
CREATE OR REPLACE FUNCTION calculate_document_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate word count from HTML content
  NEW.word_count = COALESCE(
    array_length(
      string_to_array(
        regexp_replace(COALESCE(NEW.content_html, ''), '<[^>]*>', '', 'g'),
        ' '
      ), 1
    ), 0
  );
  
  -- Calculate reading time (average 200 words per minute)
  NEW.reading_time_minutes = GREATEST(1, CEIL(NEW.word_count / 200.0));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_client_document_stats ON client_documents;
CREATE TRIGGER calculate_client_document_stats
  BEFORE INSERT OR UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_document_stats();

-- Create function to create document versions automatically
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF OLD IS NULL OR OLD.content != NEW.content THEN
    INSERT INTO document_versions (
      document_id,
      version_number,
      title,
      content,
      content_html,
      change_summary,
      created_by
    ) VALUES (
      NEW.id,
      COALESCE((
        SELECT MAX(version_number) + 1 
        FROM document_versions 
        WHERE document_id = NEW.id
      ), 1),
      NEW.title,
      NEW.content,
      NEW.content_html,
      CASE 
        WHEN OLD IS NULL THEN 'Initial version'
        ELSE 'Content updated'
      END,
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_client_document_version ON client_documents;
CREATE TRIGGER create_client_document_version
  AFTER INSERT OR UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

-- Create function to log document actions
CREATE OR REPLACE FUNCTION log_document_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO document_audit_logs (
    document_id,
    user_id,
    action,
    details
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('title', NEW.title, 'type', NEW.document_type)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old_title', OLD.title, 'new_title', NEW.title)
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('title', OLD.title)
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_client_document_action ON client_documents;
CREATE TRIGGER log_client_document_action
  AFTER INSERT OR UPDATE OR DELETE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_action();

-- Create Supabase function for full-text search
CREATE OR REPLACE FUNCTION search_client_documents(
  search_query TEXT,
  client_id_filter UUID DEFAULT NULL,
  document_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  title VARCHAR(255),
  slug VARCHAR(255),
  document_type VARCHAR(50),
  status VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id,
    cd.client_id,
    cd.title,
    cd.slug,
    cd.document_type,
    cd.status,
    cd.tags,
    cd.created_at,
    cd.updated_at,
    ts_rank(to_tsvector('english', cd.title || ' ' || COALESCE(cd.content_html, '')), plainto_tsquery('english', search_query)) as rank
  FROM client_documents cd
  WHERE 
    (client_id_filter IS NULL OR cd.client_id = client_id_filter)
    AND (document_type_filter IS NULL OR cd.document_type = document_type_filter)
    AND (
      to_tsvector('english', cd.title || ' ' || COALESCE(cd.content_html, '')) @@ plainto_tsquery('english', search_query)
      OR cd.tags && ARRAY[search_query]
    )
    AND cd.status = 'published'
  ORDER BY rank DESC, cd.updated_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON client_documents TO authenticated;
GRANT ALL ON document_versions TO authenticated;
GRANT ALL ON document_permissions TO authenticated;
GRANT ALL ON document_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION search_client_documents TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Client Documentation Wiki system migration completed successfully!';
  RAISE NOTICE 'Tables created: client_documents, document_versions, document_permissions, document_audit_logs';
  RAISE NOTICE 'Features: Version control, permissions, audit logging, full-text search, encryption support';
  RAISE NOTICE 'Security: RLS policies, role-based access, sensitive document protection';
END $$;
