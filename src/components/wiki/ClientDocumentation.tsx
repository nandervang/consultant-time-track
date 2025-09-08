import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Edit, 
  Eye, 
  Save, 
  X, 
  Lock, 
  Unlock,
  History,
  Users,
  User,
  Tag,
  Shield,
  ArrowLeft,
  Clock,
  Copy,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import DocumentEditor from '@/components/wiki/DocumentEditor';
import DocumentRenderer from '@/components/wiki/DocumentRenderer';
import DocumentList from '@/components/wiki/DocumentList';
import { EncryptionSetupDialog } from '@/components/security/EncryptionSetupDialog';
import { 
  useClientDocuments, 
  useDocumentVersions, 
  useDocumentPermissions,
  type ClientDocument, 
  type CreateDocumentData,
  type TiptapContent 
} from '@/hooks/useClientDocuments';

interface ClientDocumentationProps {
  clientId?: string;
  onBack?: () => void;
  className?: string;
}

export default function ClientDocumentation({ 
  clientId, 
  onBack, 
  className 
}: ClientDocumentationProps) {
  const [selectedDocument, setSelectedDocument] = useState<ClientDocument | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'preview'>('view');
  
  // Encryption state
  const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
  const [encryptionMode, setEncryptionMode] = useState<'setup' | 'unlock'>('setup');
  const [pendingSensitiveAction, setPendingSensitiveAction] = useState<(() => void) | null>(null);

  // Document form state
  const [formData, setFormData] = useState<CreateDocumentData>({
    client_id: clientId || '',
    title: '',
    content: { type: 'doc', content: [] },
    content_html: '',
    content_markdown: '',
    is_sensitive: false,
    document_type: 'page',
    status: 'draft',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  // Hooks
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    fetchDocuments,
    getDocumentsByClient,
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    isEncryptionActive,
    setEncryptionPassword
  } = useClientDocuments();

  const {
    versions,
    loading: versionsLoading
  } = useDocumentVersions(selectedDocument?.id);

  const {
    permissions,
    loading: permissionsLoading
  } = useDocumentPermissions(selectedDocument?.id);

  // Load documents for specific client or all documents
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        if (clientId) {
          await getDocumentsByClient(clientId);
        } else {
          await fetchDocuments();
        }
      } catch (err) {
        console.error('Error loading documents:', err);
      }
    };

    loadDocuments();
  }, [clientId, getDocumentsByClient, fetchDocuments]);

  // Helper function to reload documents after operations
  const reloadDocuments = async () => {
    try {
      if (clientId) {
        await getDocumentsByClient(clientId);
      } else {
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Error reloading documents:', err);
    }
  };

  const handleCreateDocument = () => {
    setFormData({
      client_id: clientId || '',
      title: '',
      content: { type: 'doc', content: [] },
      content_html: '',
      content_markdown: '',
      is_sensitive: false,
      document_type: 'page',
      status: 'draft',
      tags: []
    });
    setContentHtml('');
    setShowCreateDialog(true);
  };

  // Encryption handlers
  const handleEncryptionPassword = (password: string) => {
    setEncryptionPassword(password);
    setShowEncryptionDialog(false);
    
    // Execute pending action if any
    if (pendingSensitiveAction) {
      pendingSensitiveAction();
      setPendingSensitiveAction(null);
    }
  };

  const checkEncryptionForSensitiveAction = (action: () => void, needsSetup: boolean = false) => {
    if (needsSetup || !isEncryptionActive()) {
      setEncryptionMode(needsSetup ? 'setup' : 'unlock');
      setPendingSensitiveAction(() => action);
      setShowEncryptionDialog(true);
    } else {
      action();
    }
  };

  const handleDocumentClick = async (document: ClientDocument) => {
    if (document.is_sensitive && !isEncryptionActive()) {
      checkEncryptionForSensitiveAction(async () => {
        const doc = await getDocument(document.id);
        setSelectedDocument(doc);
      });
    } else {
      const doc = await getDocument(document.id);
      setSelectedDocument(doc);
    }
  };

  const handleEditDocument = (document: ClientDocument) => {
    setSelectedDocument(document);
    setFormData({
      client_id: document.client_id,
      title: document.title,
      content: document.content,
      content_html: document.content_html || '',
      content_markdown: document.content_markdown || '',
      is_sensitive: document.is_sensitive,
      document_type: document.document_type,
      status: document.status,
      tags: document.tags
    });
    setContentHtml(document.content_html || '');
    setMode('edit');
  };

  const handleSaveDocument = async () => {
    try {
      const documentData = {
        ...formData,
        content_html: contentHtml,
        tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : formData.tags
      };

      if (selectedDocument && mode === 'edit') {
        await updateDocument({ ...documentData, id: selectedDocument.id });
        const updatedDoc = await getDocument(selectedDocument.id);
        if (updatedDoc) {
          setSelectedDocument(updatedDoc);
        }
      } else {
        const newDocument = await addDocument(documentData);
        setSelectedDocument(newDocument);
        setShowCreateDialog(false);
      }
      
      setMode('view');
      await reloadDocuments();
    } catch (err) {
      console.error('Error saving document:', err);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      console.log('Starting delete process for document:', documentId);
      await deleteDocument(documentId);
      console.log('Delete successful, updating UI');
      
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setMode('view');
      }
      await reloadDocuments();
      
      // Show success message
      console.log('Document deleted successfully');
    } catch (err) {
      console.error('Error deleting document:', err);
      
      // Show user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      alert(`Error deleting document: ${errorMessage}`);
    }
  };

  const handleDuplicateDocument = async (document: ClientDocument) => {
    try {
      const newTitle = `${document.title} (Copy)`;
      await duplicateDocument(document.id, newTitle);
      await reloadDocuments();
    } catch (err) {
      console.error('Error duplicating document:', err);
    }
  };

  const handleContentChange = (content: TiptapContent, html: string) => {
    setFormData(prev => ({ ...prev, content }));
    setContentHtml(html);
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const newTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...(prev.tags || []), ...newTags])]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const clientDocuments = clientId ? documents.filter(doc => doc.client_id === clientId) : documents;

  // Group documents by client when showing all documents
  const groupedDocuments = clientId 
    ? null 
    : documents.reduce((groups, doc) => {
        const clientKey = `${doc.client_id}-${doc.client_name || 'Unknown'}`;
        if (!groups[clientKey]) {
          groups[clientKey] = {
            clientId: doc.client_id,
            clientName: doc.client_name || 'Unknown Client',
            clientCompany: doc.client_company,
            documents: []
          };
        }
        groups[clientKey].documents.push(doc);
        return groups;
      }, {} as Record<string, { 
        clientId: string; 
        clientName: string; 
        clientCompany?: string; 
        documents: ClientDocument[] 
      }>);

  const renderDocumentsList = () => {
    if (clientId) {
      // Single client view
      return (
        <DocumentList
          documents={clientDocuments}
          loading={documentsLoading}
          onDocumentClick={handleDocumentClick}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
          onDuplicateDocument={handleDuplicateDocument}
          onCreateNew={handleCreateDocument}
          showClientFilter={false}
          selectedClientId={clientId}
        />
      );
    } else {
      // All clients grouped view
      if (documentsLoading) {
        return (
          <Card>
            <CardHeader>
              <CardTitle>Loading documents...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="space-y-2">
                      {[1, 2].map((j) => (
                        <div key={j} className="border rounded-lg p-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      }

      if (!groupedDocuments || Object.keys(groupedDocuments).length === 0) {
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-sm mb-4">
                  Start by creating documentation for your clients.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <div className="space-y-6">
          {Object.values(groupedDocuments)
            .sort((a, b) => a.clientName.localeCompare(b.clientName))
            .map((clientGroup) => (
            <Card key={clientGroup.clientId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">{clientGroup.clientName}</h3>
                      {clientGroup.clientCompany && (
                        <p className="text-sm text-gray-500 font-normal">{clientGroup.clientCompany}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {clientGroup.documents.length} document{clientGroup.documents.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientGroup.documents
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .map((document) => (
                    <div
                      key={document.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleDocumentClick(document)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate flex items-center gap-2">
                            <span className="text-lg">
                              {document.document_type === 'contract' ? '📄' : 
                               document.document_type === 'specification' ? '📋' : 
                               document.document_type === 'note' ? '📝' : '📄'}
                            </span>
                            {document.title}
                            {document.is_sensitive && (
                              <Lock className="h-4 w-4 text-red-500" />
                            )}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(document.updated_at))} ago
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {document.view_count} views
                            </span>
                            <span>{document.word_count} words</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={cn(
                            'text-xs',
                            document.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' :
                            document.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          )}>
                            {document.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDocument(document);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateDocument(document);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this document?')) {
                                  handleDeleteDocument(document.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {document.tags.length > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {document.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {document.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{document.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Client Documentation
            </h2>
            <p className="text-gray-600">
              {clientId ? 'Manage documentation for this client' : 'Manage all client documentation'}
            </p>
          </div>
        </div>
      </div>

      {documentsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{documentsError}</p>
          </CardContent>
        </Card>
      )}

      {selectedDocument ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedDocument.title}
                    {selectedDocument.is_sensitive && (
                      <Badge variant="destructive" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Sensitive
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>Type: {selectedDocument.document_type}</span>
                    <span>Status: {selectedDocument.status}</span>
                    <span>Words: {selectedDocument.word_count}</span>
                    <span>Views: {selectedDocument.view_count}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {mode === 'view' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleEditDocument(selectedDocument)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setMode('preview')}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </>
                )}
                {(mode === 'edit' || mode === 'preview') && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setMode('view')}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {mode === 'edit' && (
                      <Button size="sm" onClick={handleSaveDocument}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="versions">
                  <History className="h-4 w-4 mr-1" />
                  Versions ({versions.length})
                </TabsTrigger>
                <TabsTrigger value="permissions">
                  <Users className="h-4 w-4 mr-1" />
                  Permissions ({permissions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-6">
                {mode === 'edit' ? (
                  <div className="space-y-6">
                    {/* Edit Form */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Document title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                          value={formData.document_type}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            document_type: e.target.value as 'page' | 'note' | 'contract' | 'specification'
                          }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          aria-label="Document type"
                        >
                          <option value="page">Page</option>
                          <option value="note">Note</option>
                          <option value="contract">Contract</option>
                          <option value="specification">Specification</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            status: e.target.value as 'draft' | 'published' | 'archived'
                          }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          aria-label="Document status"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Security</label>
                        <Button
                          type="button"
                          variant={formData.is_sensitive ? "destructive" : "outline"}
                          onClick={() => setFormData(prev => ({ ...prev, is_sensitive: !prev.is_sensitive }))}
                          className="w-full justify-start"
                        >
                          {formData.is_sensitive ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Sensitive Document
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              Public Document
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Tags</label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add tags (comma separated)"
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button type="button" variant="outline" onClick={addTag}>
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(formData.tags || []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-600"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Editor */}
                    <DocumentEditor
                      content={formData.content}
                      onChange={handleContentChange}
                      onSave={handleSaveDocument}
                      isSensitive={formData.is_sensitive}
                      onSensitivityToggle={() => setFormData(prev => ({ ...prev, is_sensitive: !prev.is_sensitive }))}
                      placeholder="Start writing your document..."
                    />
                  </div>
                ) : mode === 'preview' ? (
                  <DocumentRenderer content={contentHtml} />
                ) : (
                  <DocumentRenderer content={selectedDocument.content_html || ''} />
                )}
              </TabsContent>

              <TabsContent value="versions" className="mt-6">
                <div className="space-y-4">
                  {versionsLoading ? (
                    <p>Loading versions...</p>
                  ) : versions.length === 0 ? (
                    <p className="text-gray-500">No versions available</p>
                  ) : (
                    versions.map((version) => (
                      <Card key={version.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Version {version.version_number}</h4>
                              <p className="text-sm text-gray-500">
                                {version.change_summary} • {version.created_by_name} • {new Date(version.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="mt-6">
                <div className="space-y-4">
                  {permissionsLoading ? (
                    <p>Loading permissions...</p>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5" />
                        <h3 className="font-medium">Document Access Control</h3>
                      </div>
                      {permissions.length === 0 ? (
                        <p className="text-gray-500">No special permissions set. Using default access rules.</p>
                      ) : (
                        <div className="space-y-2">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <span className="font-medium">{permission.permission_level}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {permission.role_type && `(${permission.role_type})`}
                                </span>
                              </div>
                              <Badge variant="outline">{permission.permission_level}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        renderDocumentsList()
      )}

      {/* Create Document Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Document</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new document for client documentation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {/* Form fields similar to edit mode */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Document title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    document_type: e.target.value as 'page' | 'note' | 'contract' | 'specification'
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  aria-label="Document type"
                >
                  <option value="page">Page</option>
                  <option value="note">Note</option>
                  <option value="contract">Contract</option>
                  <option value="specification">Specification</option>
                </select>
              </div>
            </div>

            <DocumentEditor
              content={formData.content}
              onChange={handleContentChange}
              isSensitive={formData.is_sensitive}
              onSensitivityToggle={() => setFormData(prev => ({ ...prev, is_sensitive: !prev.is_sensitive }))}
              placeholder="Start writing your document..."
              showSaveButton={false}
              showPreviewButton={false}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveDocument}>
              Create Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EncryptionSetupDialog
        open={showEncryptionDialog}
        onOpenChange={(open) => {
          setShowEncryptionDialog(open);
          if (!open) setPendingSensitiveAction(null);
        }}
        mode={encryptionMode}
        onPasswordSet={handleEncryptionPassword}
      />
    </div>
  );
}
