import { supabase } from '../../../../lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || ''

export type UploadResult = {
  objectKey: string
  publicUrl: string
  sizeBytes: number
}

// ==========================================
// COMPRESS: resize + convert ke WebP
// Target: sisi terpanjang max 1600px, ukuran akhir ≤ 500KB
// ==========================================
export async function compressImage(file: File): Promise<Blob> {
  // Validasi tipe
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar')
  }

  const MAX_DIMENSION = 1600
  const MAX_SIZE_BYTES = 500 * 1024 // 500 KB
  const INITIAL_QUALITY = 0.85
  const MIN_QUALITY = 0.5


  const img = await loadImage(file)


  let { width, height } = img
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width)
      width = MAX_DIMENSION
    } else {
      width = Math.round((width * MAX_DIMENSION) / height)
      height = MAX_DIMENSION
    }
  }

 
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak didukung browser')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)


  let quality = INITIAL_QUALITY
  let blob: Blob | null = null

  while (quality >= MIN_QUALITY) {
    blob = await canvasToBlob(canvas, 'image/webp', quality)
    if (blob.size <= MAX_SIZE_BYTES) break
    quality -= 0.05
  }

  if (!blob) throw new Error('Gagal compress gambar')

  if (blob.size > MAX_SIZE_BYTES) {
    throw new Error(
      `Gambar masih terlalu besar (${Math.round(blob.size / 1024)}KB). Coba gambar yang lebih sederhana atau lebih kecil.`
    )
  }

  return blob
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca file gambar'))
    }
    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Gagal convert canvas ke blob'))
      },
      type,
      quality
    )
  })
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const compressedBlob = await compressImage(file)
  const sizeBytes = compressedBlob.size

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Sesi tidak valid. Silakan login ulang.')
  }

  const presignRes = await fetch(
    `${API_URL}/api/upload/presigned-url?file_type=image`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }
  )

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal meminta URL upload')
  }

  const { upload_url, object_key, content_type, public_url } = await presignRes.json()

  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': content_type },
    body: compressedBlob,
  })

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => '')
    console.error('[R2 upload error]', uploadRes.status, text)
    throw new Error(`Upload ke storage gagal (${uploadRes.status})`)
  }

  return {
    objectKey: object_key,
    publicUrl: public_url || `${R2_PUBLIC_URL}/${object_key}`,
    sizeBytes,
  }
}


export function getImageUrl(objectKey: string): string {
  if (!objectKey) return ''
  if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
    return objectKey
  }
  return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${objectKey.replace(/^\//, '')}`
}


const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024 // 10MB sebelum compress

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Format harus JPG, PNG, WebP, atau GIF'
  }
  if (file.size > MAX_ORIGINAL_SIZE) {
    return `File terlalu besar (${Math.round(file.size / 1024 / 1024)}MB). Maksimal 10MB.`
  }
  return null
}