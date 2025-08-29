import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Copy, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'
import { MotivationText, CreateMotivationTextData } from '../../hooks/useMotivationTexts'
import { CreateMotivationTextDialog } from './CreateMotivationTextDialog'

interface MotivationTextCardProps {
  motivationText: MotivationText
  onUpdate: (id: string, updates: Partial<MotivationText>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onDuplicate: (id: string, newTitle?: string) => Promise<MotivationText | null>
  onSetAsDefault: (id: string) => Promise<boolean>
  existingPurposes: string[]
  cvProfileId: string
  onCreateMotivationText: (data: CreateMotivationTextData) => Promise<MotivationText | null>
}

export function MotivationTextCard({
  motivationText,
  onUpdate,
  onDelete,
  onDuplicate,
  onSetAsDefault,
  existingPurposes,
  cvProfileId,
  onCreateMotivationText
}: MotivationTextCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(motivationText.title)
  const [editContent, setEditContent] = useState(motivationText.content)
  const [loading, setLoading] = useState(false)

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return
    
    setLoading(true)
    try {
      const success = await onUpdate(motivationText.id, {
        title: editTitle.trim(),
        content: editContent.trim()
      })
      
      if (success) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update motivation text:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(motivationText.title)
    setEditContent(motivationText.content)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this motivation text?')) {
      setLoading(true)
      try {
        await onDelete(motivationText.id)
      } catch (error) {
        console.error('Failed to delete motivation text:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSetAsDefault = async () => {
    setLoading(true)
    try {
      await onSetAsDefault(motivationText.id)
    } catch (error) {
      console.error('Failed to set as default:', error)
    } finally {
      setLoading(false)
    }
  }

  const previewContent = motivationText.content.length > 150 
    ? motivationText.content.substring(0, 150) + '...'
    : motivationText.content

  return (
    <Card className={`${motivationText.is_default ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter title"
                aria-label="Edit motivation text title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
              />
            ) : (
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {motivationText.title}
                {motivationText.is_default && (
                  <Badge variant="default" className="bg-blue-500">
                    Default
                  </Badge>
                )}
              </CardTitle>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{motivationText.purpose}</Badge>
              <span className="text-sm text-muted-foreground">
                {motivationText.word_count} words
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            {!motivationText.is_default && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSetAsDefault}
                disabled={loading}
                title="Set as default"
              >
                <StarOff className="h-4 w-4" />
              </Button>
            )}
            
            {motivationText.is_default && (
              <Button
                variant="ghost"
                size="sm"
                disabled
                title="This is the default"
              >
                <Star className="h-4 w-4 text-yellow-500" />
              </Button>
            )}
            
            <CreateMotivationTextDialog
              cvProfileId={cvProfileId}
              onCreateMotivationText={onCreateMotivationText}
              existingPurposes={existingPurposes}
              motivationTextToDuplicate={motivationText}
              triggerButton={
                <Button variant="ghost" size="sm" title="Duplicate">
                  <Copy className="h-4 w-4" />
                </Button>
              }
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full p-3 border rounded-md focus:border-blue-500 focus:outline-none resize-vertical"
              placeholder="Enter motivation text..."
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveEdit}
                disabled={loading || !editTitle.trim() || !editContent.trim()}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {isExpanded ? motivationText.content : previewContent}
            </p>
            
            {!isExpanded && motivationText.content.length > 150 && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="p-0 h-auto text-blue-600"
              >
                Read more
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
