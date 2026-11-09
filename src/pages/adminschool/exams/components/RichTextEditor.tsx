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
  Image as ImageIcon,
} from 'lucide-react'
import MathModal from './MathModal'
import ImageInsertModal from './ImageInsertModal'
import { uploadImage, validateImageFile } from './imageUploadHelper'
import { ResizableImage } from './ResizableImage'
import { Mathematics } from '@tiptap/extension-mathematics'
import 'katex/dist/katex.min.css'

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
  const [imageModalOpen, setImageModalOpen] = useState(false)

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
      ResizableImage.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg my-2',
        },
      }),
      Mathematics,
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

      // ==========================================
      // DRAG & DROP IMAGE
      // ==========================================
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false

        const dt = event.dataTransfer
        if (!dt?.files?.length) return false

        const file = Array.from(dt.files).find((f) =>
          f.type.startsWith('image/')
        )
        if (!file) return false

        event.preventDefault()

        const validationError = validateImageFile(file)
        if (validationError) {
          console.error('[RichTextEditor] Invalid image:', validationError)
          return true
        }

        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })

        uploadImage(file)
          .then((result) => {
            const pos = coords?.pos ?? view.state.selection.from
            const { schema } = view.state
            const node = schema.nodes.image.create({
              src: result.publicUrl,
              alt: file.name,
            })
            const tr = view.state.tr.insert(pos, node)
            view.dispatch(tr)
          })
          .catch((err) => {
            console.error('[RichTextEditor] Upload drop gagal:', err)
          })

        return true
      },

      // ==========================================
      // PASTE: IMAGE + AUTO-CONVERT $...$ → inlineMath
      // ==========================================
      handlePaste: (view, event) => {
        // --- 1. Handle paste gambar ---
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find((item) => item.type.startsWith('image/'))
        if (imageItem) {
          const file = imageItem.getAsFile()
          if (!file) return false

          event.preventDefault()

          const validationError = validateImageFile(file)
          if (validationError) {
            console.error('[RichTextEditor] Invalid image:', validationError)
            return true
          }

          uploadImage(file)
            .then((result) => {
              const { schema } = view.state
              const node = schema.nodes.image.create({
                src: result.publicUrl,
                alt: 'Pasted image',
              })
              const tr = view.state.tr.replaceSelectionWith(node)
              view.dispatch(tr)
            })
            .catch((err) => {
              console.error('[RichTextEditor] Upload paste gagal:', err)
            })

          return true
        }

        // --- 2. Handle paste teks dengan $...$ ---
        const textData = event.clipboardData?.getData('text/plain')
        if (!textData) return false

        // Jika tidak ada $...$ sama sekali, biarkan Tiptap handle default
        if (!/\$[^$]+\$/.test(textData)) return false

        event.preventDefault()

        // Pecah berdasarkan $...$
        const parts = textData.split(/\$([^$]+)\$/)
        const { schema } = view.state
        const inlineMathType = schema.nodes.inlineMath

        if (!inlineMathType) {
          console.warn(
            '[RichTextEditor] Node inlineMath tidak ditemukan di schema'
          )
          return false
        }

        const nodes: any[] = []
        for (let i = 0; i < parts.length; i++) {
          const chunk = parts[i]
          if (!chunk) continue

          if (i % 2 === 1) {
            // index ganjil = isi rumus
            nodes.push(inlineMathType.create({ latex: chunk }))
          } else {
            // teks biasa
            nodes.push(schema.text(chunk))
          }
        }

        if (nodes.length === 0) return false

        // Ganti selection dengan nodes yang sudah dipecah
        const tr = view.state.tr.replaceSelectionWith(
          schema.nodes.paragraph.create(null, nodes)
        )
        view.dispatch(tr)
        return true
      },
    },
  })

  // ==========================================
  // Insert math dari modal
  // ==========================================
  const handleInsertMath = useCallback(
    (latex: string) => {
      if (!editor) return
      editor.chain().focus().insertInlineMath({ latex }).run()
    },
    [editor]
  )

  const handleInsertImage = useCallback(
    (publicUrl: string) => {
      if (!editor) return
      editor.chain().focus().setImage({ src: publicUrl }).run()
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
    <div className="overflow-hidden rounded-xl border border-tp-border bg-white focus-within:border-tp-green">
      <Toolbar
        editor={editor}
        onAddLink={handleAddLink}
        onInsertTable={handleInsertTable}
        onInsertMath={() => setMathModalOpen(true)}
        onInsertImage={() => setImageModalOpen(true)}
        disabled={disabled}
      />

      <EditorContent editor={editor} />

      <MathModal
        open={mathModalOpen}
        onClose={() => setMathModalOpen(false)}
        onInsert={handleInsertMath}
      />

      <ImageInsertModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onInsert={handleInsertImage}
      />
    </div>
  )
}

// ==========================================
// Toolbar
// ==========================================
type ToolbarProps = {
  editor: Editor
  onAddLink: () => void
  onInsertTable: () => void
  onInsertMath: () => void
  onInsertImage: () => void
  disabled: boolean
}

function Toolbar({
  editor,
  onAddLink,
  onInsertTable,
  onInsertMath,
  onInsertImage,
  disabled,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-tp-border bg-slate-50/50 px-2 py-1.5">
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

      <ToolbarButton
        onClick={onAddLink}
        active={editor.isActive('link')}
        disabled={disabled}
        title="Sisipkan Link"
      >
        <LinkIcon size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={onInsertImage}
        active={editor.isActive('image')}
        disabled={disabled}
        title="Sisipkan Gambar"
        tone="image"
      >
        <ImageIcon size={14} />
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
  tone?: 'default' | 'math' | 'image'
  children: React.ReactNode
}) {
  const activeClass =
    tone === 'math'
      ? 'bg-purple-100 text-purple-700'
      : tone === 'image'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-tp-green/15 text-tp-green'

  const idleClass =
    tone === 'math'
      ? 'text-purple-600 hover:bg-purple-50'
      : tone === 'image'
      ? 'text-blue-600 hover:bg-blue-50'
      : 'text-tp-muted hover:bg-slate-200/60 hover:text-tp-text'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-8 w-8 place-items-center rounded-md transition ${
        active ? activeClass : idleClass
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-tp-border" />
}