import { useCallback, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote,
  Heading1, Heading2, Heading3,
  Link as LinkIcon, Table as TableIcon,
  Undo, Redo, Sigma, Minus,
} from 'lucide-react'
import MathModal from './MathModal'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tulis pertanyaan...',
  disabled = false,
}: Props) {
  const [mathModalOpen, setMathModalOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-tp-green underline',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3.5 py-3',
      },
    },
  })

  const handleInsertMath = useCallback(
    (latex: string) => {
      if (!editor) return
      const html = `<span class="math-inline" data-latex="${encodeURIComponent(latex)}">$${latex}$</span>`
      editor.chain().focus().insertContent(html).run()
    },
    [editor]
  )

  const handleAddLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  // Insert table 3x3
  const handleInsertTable = useCallback(() => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="rounded-xl border border-tp-border bg-white overflow-hidden focus-within:border-tp-green">
      {/* Toolbar */}
      <Toolbar
        editor={editor}
        onAddLink={handleAddLink}
        onInsertTable={handleInsertTable}
        onInsertMath={() => setMathModalOpen(true)}
        disabled={disabled}
      />

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Math modal */}
      <MathModal
        open={mathModalOpen}
        onClose={() => setMathModalOpen(false)}
        onInsert={handleInsertMath}
      />
    </div>
  )
}

type ToolbarProps = {
  editor: Editor
  onAddLink: () => void
  onInsertTable: () => void
  onInsertMath: () => void
  disabled: boolean
}

function Toolbar({ editor, onAddLink, onInsertTable, onInsertMath, disabled }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-tp-border bg-slate-50/50 px-2 py-1.5">
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={14} />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        disabled={disabled}
        title="Heading 1"
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        disabled={disabled}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        disabled={disabled}
        title="Heading 3"
      >
        <Heading3 size={14} />
      </ToolbarButton>

      <Divider />

      {/* Text format */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        disabled={disabled}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        disabled={disabled}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        disabled={disabled}
        title="Bullet List"
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        disabled={disabled}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        disabled={disabled}
        title="Blockquote"
      >
        <Quote size={14} />
      </ToolbarButton>

      <Divider />

      {/* Insert */}
      <ToolbarButton
        onClick={onAddLink}
        active={editor.isActive('link')}
        disabled={disabled}
        title="Sisipkan Link"
      >
        <LinkIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={onInsertTable}
        disabled={disabled}
        title="Sisipkan Tabel (3x3)"
      >
        <TableIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={onInsertMath}
        disabled={disabled}
        title="Sisipkan Rumus Matematika"
        tone="math"
      >
        <Sigma size={14} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
        title="Garis Horizontal"
      >
        <Minus size={14} />
      </ToolbarButton>
    </div>
  )
}


function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  tone = 'default',
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  tone?: 'default' | 'math'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-8 w-8 place-items-center rounded-md transition ${
        active
          ? tone === 'math'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-tp-green/15 text-tp-green'
          : tone === 'math'
            ? 'text-purple-600 hover:bg-purple-50'
            : 'text-tp-muted hover:bg-slate-200/60 hover:text-tp-text'
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-tp-border" />
}