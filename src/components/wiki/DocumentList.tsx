import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Search, 
  Plus, 
  FileText, 
  Clock, 
  User, 
  Tag,
  Eye,
  Edit,
  Copy,
  Trash2,
  Lock,
  Filter,
  SortAsc,
  SortDesc,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ClientDocument } from '@/hooks/useClientDocuments';

interface DocumentListProps {
  documents: ClientDocument[];
  loading?: boolean;
  onDocumentClick?: (document: ClientDocument) => void;
  onEditDocument?: (document: ClientDocument) => void;
  onDeleteDocument?: (documentId: string) => void;
  onDuplicateDocument?: (document: ClientDocument) => void;
  onCreateNew?: () => void;
  showClientFilter?: boolean;
  selectedClientId?: string;
  onClientFilterChange?: (clientId: string) => void;
  className?: string;
}

type SortField = 'title' | 'updated_at' | 'created_at' | 'word_count' | 'view_count';
type SortDirection = 'asc' | 'desc';

export default function DocumentList({
  documents,
  loading = false,
  onDocumentClick,
  onEditDocument,
  onDeleteDocument,
  onDuplicateDocument,
  onCreateNew,
  showClientFilter = true,
  selectedClientId,
  onClientFilterChange,
  className
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ClientDocument | null>(null);

  // Handle delete dialog
  const handleDeleteClick = (document: ClientDocument) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete || !onDeleteDocument) return;

    try {
      await onDeleteDocument(documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      // Show success message if you have a toast system
      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      // Keep the dialog open and show error
      // If you have a toast system, show error message:
      // toast.error(`Failed to delete document: ${error.message}`);
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  // Get unique clients for filter dropdown
  const uniqueClients = Array.from(
    new Map(
      documents
        .filter(doc => doc.client_name)
        .map(doc => [doc.client_id, { id: doc.client_id, name: doc.client_name!, company: doc.client_company }])
    ).values()
  );

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = !searchQuery || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesClient = !selectedClientId || doc.client_id === selectedClientId;
      
      return matchesSearch && matchesType && matchesStatus && matchesClient;
    })
    .sort((a, b) => {
      let aValue: string | number | Date = a[sortField];
      let bValue: string | number | Date = b[sortField];
      
      if (sortField === 'updated_at' || sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'contract': return '📄';
      case 'specification': return '📋';
      case 'note': return '📝';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading documents...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({filteredDocuments.length})
          </CardTitle>
          {onCreateNew && (
            <Button onClick={onCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Document
            </Button>
          )}
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents and tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {showClientFilter && uniqueClients.length > 1 && (
                <select
                  value={selectedClientId || 'all'}
                  onChange={(e) => onClientFilterChange?.(e.target.value === 'all' ? '' : e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                  aria-label="Filter by client"
                >
                  <option value="all">All Clients</option>
                  {uniqueClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </option>
                  ))}
                </select>
              )}
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
                aria-label="Filter by document type"
              >
                <option value="all">All Types</option>
                <option value="page">Pages</option>
                <option value="note">Notes</option>
                <option value="contract">Contracts</option>
                <option value="specification">Specifications</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
                aria-label="Filter by document status"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('updated_at')}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Updated
                {sortField === 'updated_at' && (
                  sortDirection === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('title')}
                className="text-xs"
              >
                Title
                {sortField === 'title' && (
                  sortDirection === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-sm mb-4">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || selectedClientId
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first document.'}
            </p>
            {onCreateNew && !searchQuery && (
              <Button onClick={onCreateNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create First Document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onDocumentClick?.(document)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate flex items-center gap-2">
                      <span className="text-lg">{getDocumentTypeIcon(document.document_type)}</span>
                      {document.title}
                      {document.is_sensitive && (
                        <Lock className="h-4 w-4 text-red-500" />
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {document.client_name}
                        {document.client_company && ` (${document.client_company})`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(document.updated_at))} ago
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {document.view_count} views
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Badge className={cn('text-xs', getStatusColor(document.status))}>
                      {document.status}
                    </Badge>
                    <div className="flex gap-1">
                      {onEditDocument && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDocument(document);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {onDuplicateDocument && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateDocument(document);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      {onDeleteDocument && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(document);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
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

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex gap-4">
                    <span>{document.word_count} words</span>
                    <span>{document.reading_time_minutes} min read</span>
                    <span>Created by {document.created_by_name || 'Unknown'}</span>
                  </div>
                  <span className="capitalize">{document.document_type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
