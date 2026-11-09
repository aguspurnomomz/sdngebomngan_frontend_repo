import { useCallback, useRef, useState } from 'react'
import {
  X, ImagePlus, Loader2, AlertCircle, Upload, Link2, Check,
} from 'lucide-react'
import {
  uploadImage,
  validateImageFile,
  //getImageUrl,
} from './imageUploadHelper'

type Props = {
  open: boolean
  onClose: () => void
  onInsert: (publicUrl: string) => void
}

type Tab = 'upload' | 'url'

export default function ImageInsertModal({ open, onClose, onInsert }: Props) {
  const [tab, setTab] = useState<Tab>('upload')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setUploading(false)
    setDragActive(false)
    setError(null)
    setPreviewUrl(null)
    setUrlInput('')
    setTab('upload')
  }

  const handleClose = () => {
    if (uploading) return
    reset()
    onClose()
  }

  // ==========================================
  // Handle file upload
  // ==========================================
  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // Preview lokal instan
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)
      setUploading(true)

      try {
        const result = await uploadImage(file)
        // Pakai publicUrl yang sudah digenerate helper
        setPreviewUrl(result.publicUrl)
        // Auto insert setelah upload sukses
        onInsert(result.publicUrl)
        reset()
        onClose()
      } catch (e: any) {
        console.error('[ImageInsertModal]', e)
        setError(e.message || 'Gagal upload gambar')
        setPreviewUrl(null)
      } finally {
        setUploading(false)
        URL.revokeObjectURL(localPreview)
      }
    },
    [onInsert, onClose]
  )

  // ==========================================
  // Handle insert via URL
  // ==========================================
  const handleInsertUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) {
      setError('URL tidak boleh kosong')
      return
    }
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setError('URL harus dimulai dengan http:// atau https://')
      return
    }
    onInsert(trimmed)
    reset()
    onClose()
  }

  // ==========================================
  // Drag & drop handlers
  // ==========================================
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploading) setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (uploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleFile(files[0])
    e.target.value = ''
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tp-border px-5 py-3.5">
          <h3 className="text-sm font-bold text-tp-text">Sisipkan Gambar</h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="grid h-8 w-8 place-items-center rounded-lg text-tp-muted hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-tp-border">
          <button
            type="button"
            onClick={() => setTab('upload')}
            disabled={uploading}
            className={`flex-1 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              tab === 'upload'
                ? 'border-tp-green text-tp-green'
                : 'border-transparent text-tp-muted hover:text-tp-text'
            }`}
          >
            <Upload size={12} className="mr-1 inline" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            disabled={uploading}
            className={`flex-1 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              tab === 'url'
                ? 'border-tp-green text-tp-green'
                : 'border-transparent text-tp-muted hover:text-tp-text'
            }`}
          >
            <Link2 size={12} className="mr-1 inline" />
            URL
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {tab === 'upload' && (
            <>
              {/* Preview */}
              {previewUrl && (
                <div className="mb-3 flex items-center justify-center rounded-xl border border-tp-border bg-slate-50 p-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 max-w-full rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() =>
                  !uploading && inputRef.current?.click()
                }
                className={`group flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                  dragActive
                    ? 'border-tp-green bg-tp-green/5'
                    : 'border-tp-border hover:border-tp-green/50 hover:bg-slate-50'
                } ${uploading ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {uploading ? (
                  <>
                    <Loader2
                      size={24}
                      className="animate-spin text-tp-green"
                    />
                    <p className="text-xs font-medium text-tp-muted">
                      Mengompres & mengunggah...
                    </p>
                  </>
                ) : dragActive ? (
                  <>
                    <Upload size={24} className="text-tp-green" />
                    <p className="text-xs font-semibold text-tp-green">
                      Lepaskan gambar di sini
                    </p>
                  </>
                ) : (
                  <>
                    <ImagePlus
                      size={24}
                      className="text-tp-muted transition group-hover:text-tp-green"
                    />
                    <p className="text-xs font-medium text-tp-text">
                      Klik atau tarik gambar ke sini
                    </p>
                    <p className="text-[10px] text-tp-muted">
                      JPG, PNG, WebP, GIF · Maks 10MB · Otomatis dikompres
                    </p>
                  </>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </>
          )}

          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                  URL Gambar
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value)
                    setError(null)
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20"
                  autoFocus
                />
                <p className="mt-1 text-[10px] text-tp-muted">
                  Gambar eksternal tidak akan dikompres. Gunakan upload
                  untuk performa terbaik.
                </p>
              </div>

              {urlInput.trim() && (
                <div className="rounded-xl border border-tp-border bg-slate-50 p-3">
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="mx-auto max-h-48 max-w-full rounded-lg object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display =
                        'none'
                    }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleInsertUrl}
                disabled={!urlInput.trim()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-40"
              >
                <Check size={14} /> Sisipkan
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}