import React, { useState, useEffect } from 'react'
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "../ui/checkbox"
import { Plus, Copy, FileText, Sparkles, Type } from 'lucide-react'
import { CreateMotivationTextData, MotivationText } from '../../hooks/useMotivationTexts'
import { RichTextEditor } from './RichTextEditor'

interface CreateMotivationTextDialogProps {
  cvProfileId: string
  onCreateMotivationText: (data: CreateMotivationTextData) => Promise<MotivationText | null>
  existingPurposes: string[]
  motivationTextToDuplicate?: MotivationText | null
  triggerButton?: React.ReactNode
}

const PURPOSE_OPTIONS = [
  'General',
  'Tech Role', 
  'Leadership',
  'Startup',
  'Consulting',
  'Product Management',
  'Frontend Development',
  'Fullstack Development',
  'Accessibility Expert',
  'Project Management'
]

export function CreateMotivationTextDialog({
  cvProfileId,
  onCreateMotivationText,
  existingPurposes,
  motivationTextToDuplicate,
  triggerButton
}: CreateMotivationTextDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [purpose, setPurpose] = useState('')
  const [customPurpose, setCustomPurpose] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  
  // Rich text enhancement fields
  const [contentType, setContentType] = useState<'plain_text' | 'rich_text' | 'markdown'>('plain_text')
  const [richContent, setRichContent] = useState<any>(null)
  const [tone, setTone] = useState('professional')
  const [targetKeywords, setTargetKeywords] = useState<string[]>([])
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  // Pre-fill form if duplicating
  useEffect(() => {
    if (motivationTextToDuplicate && open) {
      setTitle(`${motivationTextToDuplicate.title} (Copy)`)
      setContent(motivationTextToDuplicate.content)
      setPurpose(motivationTextToDuplicate.purpose)
      setIsDefault(false) // Copies are never default
      
      // Set rich text fields if available
      setContentType(motivationTextToDuplicate.content_type || 'plain_text')
      setRichContent(motivationTextToDuplicate.rich_content)
      setTone(motivationTextToDuplicate.tone || 'professional')
      setTargetKeywords(motivationTextToDuplicate.target_keywords || [])
      setIsAiGenerated(motivationTextToDuplicate.is_ai_generated || false)
      setAiPrompt(motivationTextToDuplicate.ai_prompt_used || '')
    } else if (open && !motivationTextToDuplicate) {
      // Reset form for new text
      setTitle('')
      setContent('')
      setPurpose('')
      setCustomPurpose('')
      setIsDefault(false)
      setContentType('plain_text')
      setRichContent(null)
      setTone('professional')
      setTargetKeywords([])
      setIsAiGenerated(false)
      setAiPrompt('')
    }
  }, [motivationTextToDuplicate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    try {
      const finalPurpose = purpose === 'custom' ? customPurpose : purpose
      
      const motivationTextData: CreateMotivationTextData = {
        cv_profile_id: cvProfileId,
        title: title.trim(),
        content: content.trim(),
        purpose: finalPurpose.trim(),
        is_default: isDefault,
        content_type: contentType,
        rich_content: richContent,
        tone: tone,
        target_keywords: targetKeywords,
        is_ai_generated: isAiGenerated,
        ai_prompt_used: aiPrompt.trim() || null
      }

      const result = await onCreateMotivationText(motivationTextData)
      
      if (result) {
        setOpen(false)
        // Reset form
        setTitle('')
        setContent('')
        setPurpose('')
        setCustomPurpose('')
        setIsDefault(false)
        setContentType('plain_text')
        setRichContent(null)
        setTone('professional')
        setTargetKeywords([])
        setIsAiGenerated(false)
        setAiPrompt('')
      }
    } catch (error) {
      console.error('Failed to create motivation text:', error)
    } finally {
      setLoading(false)
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const defaultTrigger = motivationTextToDuplicate ? (
    <Button variant="outline" size="sm">
      <Copy className="h-4 w-4 mr-2" />
      Duplicate
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Motivation Text
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {motivationTextToDuplicate ? 'Duplicate Motivation Text' : 'Add New Motivation Text'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Frontend Developer Role, Leadership Position..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose/Type</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose or type" />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
                {existingPurposes
                  .filter(p => !PURPOSE_OPTIONS.includes(p))
                  .map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))
                }
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {purpose === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customPurpose">Custom Purpose</Label>
              <Input
                id="customPurpose"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                placeholder="Enter custom purpose..."
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Motivation Text</Label>
            <RichTextEditor
              value={content}
              onChange={(value, richContentData) => {
                setContent(value)
                setRichContent(richContentData)
              }}
              placeholder="Write your motivation text here. This could be a cover letter, personal summary, or role-specific motivation..."
              contentType={contentType}
              onContentTypeChange={setContentType}
              tone={tone}
              onToneChange={setTone}
              targetKeywords={targetKeywords}
              onKeywordsChange={setTargetKeywords}
            />
          </div>

          {/* AI Generation Fields */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAiGenerated"
                checked={isAiGenerated}
                onCheckedChange={(checked) => setIsAiGenerated(checked as boolean)}
              />
              <Label htmlFor="isAiGenerated" className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Generated Content
              </Label>
            </div>
            
            {isAiGenerated && (
              <div className="space-y-2">
                <Label htmlFor="aiPrompt">AI Prompt Used</Label>
                <Textarea
                  id="aiPrompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the prompt you used to generate this content..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked as boolean)}
            />
            <Label htmlFor="isDefault" className="text-sm">
              Set as default motivation text
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? 'Creating...' : (motivationTextToDuplicate ? 'Create Copy' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
