import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Save,
  Eye,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  CheckSquare,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TiptapContent } from '@/hooks/useClientDocuments';

const lowlight = createLowlight(common);

interface DocumentEditorProps {
  content?: TiptapContent;
  placeholder?: string;
  onChange?: (content: TiptapContent, html: string, text: string) => void;
  onSave?: () => void;
  onPreview?: () => void;
  className?: string;
  readOnly?: boolean;
  isSensitive?: boolean;
  onSensitivityToggle?: () => void;
  showSaveButton?: boolean;
  showPreviewButton?: boolean;
  saveButtonText?: string;
  isLoading?: boolean;
  characterLimit?: number;
}

export default function DocumentEditor({
  content,
  placeholder = "Start writing your document...",
  onChange,
  onSave,
  onPreview,
  className,
  readOnly = false,
  isSensitive = false,
  onSensitivityToggle,
  showSaveButton = true,
  showPreviewButton = true,
  saveButtonText = "Save",
  isLoading = false,
  characterLimit = 50000
}: DocumentEditorProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      CharacterCount,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const currentContent = editor.getJSON();
      // Only emit update if content actually changed
      if (JSON.stringify(currentContent) !== JSON.stringify(content) && onChange) {
        onChange(currentContent, editor.getHTML(), editor.getText());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[500px] p-8 max-w-none',
      },
      handleKeyDown: (_view, event) => {
        // Allow fullscreen toggle with F11
        if (event.key === 'F11') {
          event.preventDefault();
          setIsFullScreen(!isFullScreen);
          return true;
        }
        return false;
      },
    },
    editable: !readOnly,
  });

  const addLink = () => {
    if (!editor) return;
    
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    if (!editor) return;
    
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();
  const isNearLimit = characterLimit && characterCount > characterLimit * 0.8;
  const isOverLimit = characterLimit && characterCount > characterLimit;

  return (
    <div className={cn(
      "border rounded-lg bg-white transition-all duration-300",
      isFullScreen && "fixed inset-0 z-50 rounded-none border-0 h-screen flex flex-col",
      className
    )}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b p-3 flex flex-wrap gap-1 bg-gray-50/50 flex-shrink-0">
          {/* Text Formatting */}
          <div className="flex gap-1 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'bg-gray-200' : ''}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'bg-gray-200' : ''}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive('paragraph') ? 'bg-gray-200' : ''}
            >
              <Type className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists and Quote */}
          <div className="flex gap-1 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? 'bg-gray-200' : ''}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Text Alignment */}
          <div className="flex gap-1 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Highlighting */}
          <div className="flex gap-1 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? 'bg-yellow-200' : ''}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </div>

          {/* Insert Elements */}
          <div className="flex gap-1 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={addLink}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addImage}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addTable}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit full screen (F11)" : "Enter full screen (F11)"}
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 mx-1" />

            {onSensitivityToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSensitivityToggle}
                className={isSensitive ? 'text-red-600' : 'text-gray-600'}
              >
                {isSensitive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Button>
            )}
            {showPreviewButton && onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreview}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {showSaveButton && onSave && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={isLoading || Boolean(isOverLimit)}
              >
                <Save className="h-4 w-4 mr-1" />
                {saveButtonText}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className={cn(
        "flex-1 overflow-auto",
        isFullScreen ? "p-8" : "p-6"
      )}>
        <EditorContent 
          editor={editor} 
          className={cn(
            "prose prose-sm max-w-none focus:outline-none",
            "prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
            "prose-p:leading-relaxed prose-li:leading-relaxed",
            "prose-pre:bg-gray-100 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
            "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic",
            "prose-table:table-auto prose-th:text-left prose-th:font-semibold",
            readOnly && "cursor-default"
          )}
        />
      </div>

      {/* Footer */}
      <div className="border-t p-3 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span className={cn(
            isOverLimit && "text-red-600 font-semibold",
            isNearLimit && !isOverLimit && "text-yellow-600"
          )}>
            {characterCount}
            {characterLimit && ` / ${characterLimit}`} characters
          </span>
          {isSensitive && (
            <Badge variant="destructive" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Sensitive
            </Badge>
          )}
        </div>
        
        {isOverLimit && (
          <span className="text-red-600 text-xs font-medium">
            Character limit exceeded
          </span>
        )}
      </div>
    </div>
  );
}
