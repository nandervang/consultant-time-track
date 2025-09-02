-- Create test documents if none exist
-- First, let's check if we have any clients
DO $$
DECLARE
    client_count INTEGER;
    test_client_id UUID;
    doc_count INTEGER;
BEGIN
    -- Check if we have clients
    SELECT COUNT(*) INTO client_count FROM clients;
    
    IF client_count = 0 THEN
        -- Create a test client
        INSERT INTO clients (name, email, company, hourly_rate, currency, status, created_by)
        VALUES 
            ('John Doe', 'john@example.com', 'Acme Corp', 800.00, 'SEK', 'active', (SELECT id FROM auth.users LIMIT 1))
        RETURNING id INTO test_client_id;
        
        RAISE NOTICE 'Created test client: %', test_client_id;
    ELSE
        -- Use existing client
        SELECT id INTO test_client_id FROM clients LIMIT 1;
        RAISE NOTICE 'Using existing client: %', test_client_id;
    END IF;
    
    -- Check if we have documents
    SELECT COUNT(*) INTO doc_count FROM client_documents;
    
    IF doc_count = 0 THEN
        -- Create test documents
        INSERT INTO client_documents (
            client_id, 
            title, 
            slug,
            content, 
            content_html, 
            content_markdown,
            is_sensitive,
            document_type,
            status,
            tags,
            word_count,
            reading_time_minutes,
            created_by,
            updated_by
        ) VALUES 
        (
            test_client_id,
            'Project Specification',
            'project-specification',
            '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Project Specification"}]},{"type":"paragraph","content":[{"type":"text","text":"This is a comprehensive project specification document for the client."}]}]}',
            '<h1>Project Specification</h1><p>This is a comprehensive project specification document for the client.</p>',
            '# Project Specification\n\nThis is a comprehensive project specification document for the client.',
            false,
            'specification',
            'published',
            ARRAY['project', 'spec', 'requirements'],
            15,
            1,
            (SELECT id FROM auth.users LIMIT 1),
            (SELECT id FROM auth.users LIMIT 1)
        ),
        (
            test_client_id,
            'Meeting Notes',
            'meeting-notes',
            '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Meeting Notes"}]},{"type":"paragraph","content":[{"type":"text","text":"Notes from our weekly client meeting."}]}]}',
            '<h1>Meeting Notes</h1><p>Notes from our weekly client meeting.</p>',
            '# Meeting Notes\n\nNotes from our weekly client meeting.',
            false,
            'note',
            'draft',
            ARRAY['meeting', 'notes'],
            10,
            1,
            (SELECT id FROM auth.users LIMIT 1),
            (SELECT id FROM auth.users LIMIT 1)
        );
        
        RAISE NOTICE 'Created test documents';
    ELSE
        RAISE NOTICE 'Documents already exist: %', doc_count;
    END IF;
END
$$;
