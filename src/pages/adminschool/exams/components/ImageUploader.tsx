import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Trash2, Loader2, AlertCircle, Upload } from 'lucide-react'

import {
  uploadImage,
  getImageUrl,
  validateImageFile,
} from './imageUploadHelper'

type Props = {
  value?: string
  onChange: (objectKey: string) => void
  label?: string
  disabled?: boolean
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Gambar Soal (opsional)',
  disabled = false,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)


  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      // Validasi
      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setUploading(true)
      try {
        const result = await uploadImage(file)
        onChange(result.objectKey)
      } catch (e: any) {
        console.error('[ImageUploader]', e)
        setError(e.message || 'Gagal upload gambar')
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )


  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading) setDragActive(true)
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

    if (disabled || uploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    // Reset input supaya bisa pilih file yang sama 2x
    e.target.value = ''
  }

  const onRemove = () => {
    if (disabled) return
    onChange('')
    setError(null)
  }


  if (value) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">
          {label}
        </label>
        <div className="relative inline-block overflow-hidden rounded-xl border border-tp-border bg-slate-50">
          <img
            src={getImageUrl(value)}
            alt="Preview"
            className="max-h-48 max-w-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-rose-500 shadow-sm transition hover:bg-rose-50"
              title="Hapus gambar"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        {error && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-600">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-tp-text">
        {label}
      </label>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragActive
            ? 'border-tp-green bg-tp-green/5'
            : 'border-tp-border hover:border-tp-green/50 hover:bg-slate-50'
        } ${disabled || uploading ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin text-tp-green" />
            <p className="text-xs font-medium text-tp-muted">
              Mengompres & mengunggah...
            </p>
          </>
        ) : dragActive ? (
          <>
            <Upload size={20} className="text-tp-green" />
            <p className="text-xs font-semibold text-tp-green">
              Lepaskan gambar di sini
            </p>
          </>
        ) : (
          <>
            <ImagePlus
              size={20}
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
        disabled={disabled || uploading}
      />

      {error && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-600">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}