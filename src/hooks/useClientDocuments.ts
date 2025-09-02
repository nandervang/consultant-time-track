import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { encryptSensitiveContent, decryptSensitiveContent, encryptionSession } from '../lib/encryption-simple';

// Tiptap JSON content type
export interface TiptapContent {
  type: string;
  content?: TiptapContent[];
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  title: string;
  slug: string;
  content: TiptapContent; // Tiptap JSON
  content_html?: string;
  content_markdown?: string;
  is_sensitive: boolean;
  encrypted_content?: string;
  document_type: 'page' | 'note' | 'contract' | 'specification';
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  reading_time_minutes: number;
  word_count: number;
  created_by: string;
  updated_by?: string;
  last_viewed_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  client_name?: string;
  client_company?: string;
  created_by_name?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: TiptapContent;
  content_html?: string;
  change_summary?: string;
  created_by: string;
  created_at: string;
  created_by_name?: string;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id?: string;
  role_type?: 'client_team' | 'consultant_team' | 'admin';
  permission_level: 'read' | 'write' | 'admin';
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface CreateDocumentData {
  client_id: string;
  title: string;
  content: TiptapContent;
  content_html?: string;
  content_markdown?: string;
  is_sensitive?: boolean;
  encrypted_content?: string;
  document_type?: 'page' | 'note' | 'contract' | 'specification';
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {
  id: string;
}

export interface DocumentSearchParams {
  query?: string;
  client_id?: string;
  document_type?: string;
  status?: string;
  tags?: string[];
  is_sensitive?: boolean;
}

export function useClientDocuments() {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use left join (regular join) instead of inner join
      const { data, error: fetchError } = await supabase
        .from('client_documents')
        .select(`
          *,
          clients(
            name,
            company
          )
        `)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const documentsWithJoins = (data || []).map(doc => ({
        ...doc,
        client_name: doc.clients?.name || 'Unknown Client',
        client_company: doc.clients?.company,
        created_by_name: 'User'
      }));

      setDocuments(documentsWithJoins);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const getDocumentsByClient = useCallback(async (clientId: string): Promise<ClientDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select(`
          *,
          clients(
            name,
            company
          )
        `)
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map((doc: ClientDocument & { clients?: { name?: string; company?: string } }) => ({
        ...doc,
        client_name: doc.clients?.name || 'Unknown Client',
        client_company: doc.clients?.company,
        created_by_name: 'User' // Simplified for now
      })) || [];
    } catch (err) {
      console.error('Error fetching client documents:', err);
      throw err;
    }
  }, []);

  const getDocument = async (id: string): Promise<ClientDocument | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('client_documents')
        .select(`
          *,
          clients(
            name,
            company
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update view count and last viewed
      await supabase
        .from('client_documents')
        .update({ 
          view_count: (data.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', id);

      const baseDocument = {
        ...data,
        client_name: data.clients?.name || 'Unknown Client',
        client_company: data.clients?.company,
        created_by_name: 'User' // Simplified for now
      };

      // Decrypt content if it's a sensitive document
      if (baseDocument.is_sensitive && baseDocument.encrypted_content) {
        const password = encryptionSession.getPassword();
        if (password) {
          try {
            const decryptedContent = await decryptSensitiveContent(
              baseDocument.encrypted_content, 
              password
            );
            return {
              ...baseDocument,
              content: JSON.parse(decryptedContent),
              content_html: '[Decrypted Content - Render from JSON]'
            };
          } catch (decryptError) {
            console.error('Failed to decrypt document content:', decryptError);
            // Keep encrypted placeholders if decryption fails
          }
        }
      }

      return baseDocument;
    } catch (err) {
      console.error('Error fetching document:', err);
      throw err;
    }
  };

  const searchDocuments = async (params: DocumentSearchParams): Promise<ClientDocument[]> => {
    try {
      let query = supabase
        .from('client_documents')
        .select(`
          *,
          clients!inner(
            name,
            company
          )
        `);

      if (params.client_id) {
        query = query.eq('client_id', params.client_id);
      }

      if (params.document_type) {
        query = query.eq('document_type', params.document_type);
      }

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.is_sensitive !== undefined) {
        query = query.eq('is_sensitive', params.is_sensitive);
      }

      if (params.tags && params.tags.length > 0) {
        query = query.overlaps('tags', params.tags);
      }

      if (params.query) {
        query = query.or(`title.ilike.%${params.query}%,content_html.ilike.%${params.query}%`);
      }

      query = query.order('updated_at', { ascending: false });

      const { data, error: searchError } = await query;

      if (searchError) throw searchError;

      return data?.map(doc => ({
        ...doc,
        client_name: doc.clients?.name,
        client_company: doc.clients?.company,
        created_by_name: 'User' // Simplified for now
      })) || [];
    } catch (err) {
      console.error('Error searching documents:', err);
      throw err;
    }
  };

  const addDocument = async (documentData: CreateDocumentData): Promise<ClientDocument> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const slug = documentData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let insertData = {
        ...documentData,
        slug,
        created_by: user.user.id,
        updated_by: user.user.id,
      };

      // Handle encryption for sensitive documents
      if (documentData.is_sensitive) {
        const password = encryptionSession.getPassword();
        if (!password) {
          throw new Error('Encryption password required for sensitive documents');
        }

        // Encrypt the content and store in encrypted_content field
        const encryptedContent = await encryptSensitiveContent(
          JSON.stringify(documentData.content), 
          password
        );
        
        insertData = {
          ...insertData,
          encrypted_content: encryptedContent,
          content: {} as TiptapContent, // Clear original content
          content_html: '[Encrypted Content]',
          content_markdown: '[Encrypted Content]'
        };
      }

      const { data, error: insertError } = await supabase
        .from('client_documents')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchDocuments();
      return data;
    } catch (err) {
      console.error('Error adding document:', err);
      throw err;
    }
  };

  const updateDocument = async (documentData: UpdateDocumentData): Promise<ClientDocument> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const updateData: Partial<CreateDocumentData> & { 
        id: string; 
        updated_by: string; 
        updated_at: string; 
        slug?: string; 
      } = {
        ...documentData,
        updated_by: user.user.id,
        updated_at: new Date().toISOString()
      };

      if (documentData.title) {
        updateData.slug = documentData.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      const { data, error: updateError } = await supabase
        .from('client_documents')
        .update(updateData)
        .eq('id', documentData.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchDocuments();
      return data;
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  };

  const deleteDocument = async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  const duplicateDocument = async (id: string, newTitle: string): Promise<ClientDocument> => {
    try {
      const original = await getDocument(id);
      if (!original) throw new Error('Document not found');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const duplicateData: CreateDocumentData = {
        client_id: original.client_id,
        title: newTitle,
        content: original.content,
        content_html: original.content_html,
        content_markdown: original.content_markdown,
        is_sensitive: original.is_sensitive,
        document_type: original.document_type,
        status: 'draft',
        tags: [...(original.tags || [])]
      };

      return await addDocument(duplicateData);
    } catch (err) {
      console.error('Error duplicating document:', err);
      throw err;
    }
  };

  const isEncryptionActive = (): boolean => {
    return encryptionSession.isActive();
  };

  const setEncryptionPassword = (password: string): void => {
    encryptionSession.setPassword(password);
  };

  const clearEncryptionSession = (): void => {
    encryptionSession.clearSession();
  };

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    getDocumentsByClient,
    getDocument,
    searchDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    isEncryptionActive,
    setEncryptionPassword,
    clearEncryptionSession
  };
}

export function useDocumentVersions(documentId?: string) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (fetchError) throw fetchError;

      const versionsWithJoins = data?.map(version => ({
        ...version,
        created_by_name: 'User' // Simplified for now
      })) || [];

      setVersions(versionsWithJoins);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch versions');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      fetchVersions();
    }
  }, [documentId, fetchVersions]);

  const getVersion = async (versionId: string): Promise<DocumentVersion | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('document_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (fetchError) throw fetchError;

      return {
        ...data,
        created_by_name: 'User' // Simplified for now
      };
    } catch (err) {
      console.error('Error fetching version:', err);
      throw err;
    }
  };

  return {
    versions,
    loading,
    error,
    fetchVersions,
    getVersion
  };
}

export function useDocumentPermissions(documentId?: string) {
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('document_permissions')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPermissions(data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      fetchPermissions();
    }
  }, [documentId, fetchPermissions]);

  const grantPermission = async (
    userId: string,
    permissionLevel: 'read' | 'write' | 'admin',
    roleType?: 'client_team' | 'consultant_team' | 'admin',
    expiresAt?: string
  ): Promise<void> => {
    if (!documentId) throw new Error('Document ID is required');

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error: insertError } = await supabase
        .from('document_permissions')
        .insert({
          document_id: documentId,
          user_id: userId,
          permission_level: permissionLevel,
          role_type: roleType,
          granted_by: user.user.id,
          expires_at: expiresAt
        });

      if (insertError) throw insertError;

      await fetchPermissions();
    } catch (err) {
      console.error('Error granting permission:', err);
      throw err;
    }
  };

  const revokePermission = async (permissionId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('document_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (updateError) throw updateError;

      await fetchPermissions();
    } catch (err) {
      console.error('Error revoking permission:', err);
      throw err;
    }
  };

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    grantPermission,
    revokePermission
  };
}
