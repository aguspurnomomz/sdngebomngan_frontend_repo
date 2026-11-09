import { useCallback, useRef } from 'react'
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import Image from '@tiptap/extension-image'
import {
  AlignLeft, AlignCenter, AlignRight, Maximize2,
} from 'lucide-react'

// ==========================================
// Node View — gambar dengan resize + alignment toolbar
// ==========================================
function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, alignment } = node.attrs
  const wrapperRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const startRef = useRef<{
    x: number
    y: number
    width: number
    aspectRatio: number
  } | null>(null)

  // ==========================================
  // Handle drag resize (drag corner bottom-right)
  // ==========================================
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const img = imgRef.current
      if (!img) return

      const rect = img.getBoundingClientRect()
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        aspectRatio: rect.width / rect.height,
      }

      const onMove = (moveEvent: MouseEvent) => {
        if (!startRef.current) return
        const dx = moveEvent.clientX - startRef.current.x
        const newWidth = Math.max(80, startRef.current.width + dx)
        updateAttributes({ width: Math.round(newWidth) })
      }

      const onUp = () => {
        startRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [updateAttributes]
  )

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`image-resizer ${selected ? 'selected' : ''}`}
      data-alignment={alignment}
    >
      <div
        className="image-resizer-inner"
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          width={width || undefined}
          className="rounded-lg"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            width: width ? `${width}px` : undefined,
          }}
          draggable={false}
        />

        {/* ==========================================
            Toolbar — muncul saat gambar dipilih
            ========================================== */}
        {selected && (
          <div
            className="image-toolbar"
            contentEditable={false}
            style={{
              position: 'absolute',
              top: '-42px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '2px',
              padding: '4px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              zIndex: 10,
            }}
          >
            <ToolbarBtn
              title="Rata kiri"
              active={alignment === 'left'}
              onClick={() => updateAttributes({ alignment: 'left' })}
            >
              <AlignLeft size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              title="Rata tengah"
              active={alignment === 'center' || !alignment}
              onClick={() => updateAttributes({ alignment: 'center' })}
            >
              <AlignCenter size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              title="Rata kanan"
              active={alignment === 'right'}
              onClick={() => updateAttributes({ alignment: 'right' })}
            >
              <AlignRight size={14} />
            </ToolbarBtn>

            <div
              style={{
                width: '1px',
                background: '#e5e7eb',
                margin: '0 2px',
              }}
            />

            <ToolbarBtn
              title="Reset ukuran"
              onClick={() => updateAttributes({ width: null })}
            >
              <Maximize2 size={14} />
            </ToolbarBtn>
          </div>
        )}

        {/* ==========================================
            Resize Handle — sudut kanan bawah
            ========================================== */}
        {selected && (
          <div
            onMouseDown={onMouseDown}
            className="image-resize-handle"
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: '-6px',
              width: '14px',
              height: '14px',
              background: '#10b981',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              zIndex: 11,
            }}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}

function ToolbarBtn({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '26px',
        height: '26px',
        borderRadius: '6px',
        border: 'none',
        background: active ? '#d1fae5' : 'transparent',
        color: active ? '#10b981' : '#6b7280',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ==========================================
// Extension — extend Image dengan NodeView custom
// ==========================================
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute('width')
          return w ? parseInt(w, 10) : null
        },
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      alignment: {
        default: 'center',
        parseHTML: (el) => el.getAttribute('data-alignment') || 'center',
        renderHTML: (attrs) => ({
          'data-alignment': attrs.alignment,
        }),
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})