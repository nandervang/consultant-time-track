import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote,
  Undo,
  Redo,
  Eye,
  Type,
  Target,
  Clock
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string, richContent?: any) => void
  placeholder?: string
  className?: string
  contentType?: 'plain_text' | 'rich_text' | 'markdown'
  onContentTypeChange?: (type: 'plain_text' | 'rich_text' | 'markdown') => void
  tone?: string
  onToneChange?: (tone: string) => void
  targetKeywords?: string[]
  onKeywordsChange?: (keywords: string[]) => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your motivation text...",
  className = "",
  contentType = 'plain_text',
  onContentTypeChange,
  tone = 'professional',
  onToneChange,
  targetKeywords = [],
  onKeywordsChange
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [wordCount, setWordCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const [newKeyword, setNewKeyword] = useState('')

  // Calculate metrics
  useEffect(() => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0).length
    setWordCount(words)
    setReadingTime(Math.max(1, Math.round(words / 200))) // 200 words per minute
  }, [value])

  const formatText = useCallback((command: string, value?: string) => {
    if (contentType !== 'rich_text') return

    document.execCommand(command, false, value)
  }, [contentType])

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    if (contentType !== 'markdown') return

    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = prefix + selectedText + suffix

    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)

    // Reset cursor position
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length
      textarea.selectionEnd = start + prefix.length + selectedText.length
      textarea.focus()
    }, 0)
  }, [value, onChange, contentType])

  const addKeyword = () => {
    if (newKeyword.trim() && !targetKeywords.includes(newKeyword.trim())) {
      onKeywordsChange?.([...targetKeywords, newKeyword.trim()])
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    onKeywordsChange?.(targetKeywords.filter(k => k !== keyword))
  }

  const renderPlainTextEditor = () => (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`min-h-[300px] resize-none ${className}`}
      rows={12}
    />
  )

  const renderRichTextEditor = () => (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-gray-300 mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-gray-300 mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('undo')}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('redo')}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <div
        contentEditable
        className={`p-4 min-h-[300px] outline-none ${className}`}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  )

  const renderMarkdownEditor = () => (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('**', '**')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('*', '*')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-gray-300 mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('- ', '')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('1. ', '')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('> ', '')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <Textarea
        id="markdown-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`min-h-[300px] resize-none border-0 rounded-none ${className}`}
        rows={12}
      />
    </div>
  )

  const renderPreview = () => {
    if (contentType === 'markdown') {
      // Simple markdown preview - in a real app, you'd use a proper markdown parser
      const htmlContent = value
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n/g, '<br>')

      return (
        <div 
          className="prose prose-sm max-w-none p-4 min-h-[300px] border rounded-md"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )
    }

    return (
      <div className="prose prose-sm max-w-none p-4 min-h-[300px] border rounded-md whitespace-pre-wrap">
        {value || <span className="text-gray-400">Nothing to preview...</span>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Content Type & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="content-type">Content Type</Label>
          <Select 
            value={contentType} 
            onValueChange={(value) => onContentTypeChange?.(value as 'plain_text' | 'rich_text' | 'markdown')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plain_text">Plain Text</SelectItem>
              <SelectItem value="rich_text">Rich Text</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tone">Tone</Label>
          <Select 
            value={tone} 
            onValueChange={(value) => onToneChange?.(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            {wordCount} words
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {readingTime} min read
          </div>
        </div>
      </div>

      {/* Keywords */}
      {onKeywordsChange && (
        <div>
          <Label htmlFor="keywords">Target Keywords (ATS Optimization)</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add keyword..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button onClick={addKeyword} size="sm">
              <Target className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {targetKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                  {keyword} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'write' | 'preview')}>
        <TabsList>
          <TabsTrigger value="write">
            <Type className="h-4 w-4 mr-2" />
            Write
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="mt-4">
          {contentType === 'plain_text' && renderPlainTextEditor()}
          {contentType === 'rich_text' && renderRichTextEditor()}
          {contentType === 'markdown' && renderMarkdownEditor()}
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          {renderPreview()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RichTextEditor
