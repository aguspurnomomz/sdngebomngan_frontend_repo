import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, X,
} from 'lucide-react'

interface Ebook {
  id: string
  judul: string
  jenjang: string
  mata_pelajaran: string
  kategori: string
  cover_url: string
  file_url: string
  created_at: string
}

type EbookForm = {
  judul: string
  jenjang: string
  mata_pelajaran: string
  kategori: string
  cover_url: string
  file_url: string
}

const EMPTY_FORM: EbookForm = {
  judul: '',
  jenjang: 'SMA/MA',
  mata_pelajaran: '',
  kategori: 'Kurikulum Merdeka',
  cover_url: '',
  file_url: '',
}

const ITEMS_PER_PAGE = 10
const JENJANG_OPTIONS = ['SD/MI', 'SMP/MTs', 'SMA/MA'] as const
//const KATEGORI_OPTIONS = ['Kurikulum Merdeka', 'Kurikulum 2013', 'Nonteks'] as const

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as any)?.error || e.message
  }
  if (e instanceof Error) return e.message
  return String(e)
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function validateForm(form: EbookForm): string | null {
  if (!form.judul.trim()) return 'Judul buku wajib diisi.'
  if (!form.mata_pelajaran.trim()) return 'Mata pelajaran wajib diisi.'
  if (!form.file_url.trim()) return 'URL file PDF wajib diisi.'
  if (!isValidHttpUrl(form.file_url.trim())) {
    return 'URL file PDF harus berupa http:// atau https:// yang valid.'
  }
  if (form.cover_url.trim() && !isValidHttpUrl(form.cover_url.trim())) {
    return 'URL cover harus berupa http:// atau https:// yang valid.'
  }
  return null
}

export default function SuperAdminEbooks() {
  const navigate = useNavigate()
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [form, setForm] = useState<EbookForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const API_URL = import.meta.env.VITE_API_URL
  const adminToken = localStorage.getItem('superadmin_token')
  const successTimerRef = useRef<number | null>(null)

  const setField = <K extends keyof EbookForm>(key: K, value: EbookForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => setSuccessMessage(''), 4000)
  }

  const clampPage = (list: Ebook[]) => {
    const maxPage = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE))
    setCurrentPage((p) => Math.min(p, maxPage))
  }

  const fetchEbooks = async (showLoading = true) => {
    if (!adminToken) {
      navigate('/superadmin/login', { replace: true })
      return
    }
    try {
      if (showLoading) setLoading(true)
      setLoadError('')
      const res = await axios.get(`${API_URL}/api/superadmin/ebooks`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const list: Ebook[] = res.data.ebooks || []
      setEbooks(list)
      clampPage(list)
    } catch (e: unknown) {
      console.error('Gagal memuat e-book:', e)
      setLoadError(getErrorMessage(e))
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchEbooks(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    }
  }, [])

  const openModal = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setActionError('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (submitting) return
    setShowModal(false)
    setFormError('')
  }

  const handleCreateEbook = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }
    if (!adminToken) {
      setFormError('Sesi tidak valid. Silakan login ulang.')
      return
    }

    try {
      setSubmitting(true)
      setFormError('')
      setActionError('')
      await axios.post(
        `${API_URL}/api/superadmin/ebooks`,
        {
          judul: form.judul.trim(),
          jenjang: form.jenjang,
          mata_pelajaran: form.mata_pelajaran.trim(),
          kategori: form.kategori,
          cover_url: form.cover_url.trim(),
          file_url: form.file_url.trim(),
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      setShowModal(false)
      setForm(EMPTY_FORM)
      showSuccess('E-book berhasil ditambahkan.')
      await fetchEbooks(false)
    } catch (e: unknown) {
      console.error('Gagal menambah e-book:', e)
      setFormError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEbook = async (id: string, judulBuku: string) => {
    if (deletingId) return
    if (!window.confirm(`Yakin ingin menghapus e-book "${judulBuku}"?`)) return
    if (!adminToken) {
      setActionError('Sesi tidak valid. Silakan login ulang.')
      return
    }

    try {
      setDeletingId(id)
      setActionError('')
      await axios.delete(`${API_URL}/api/superadmin/ebooks/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      showSuccess('E-book berhasil dihapus.')
      await fetchEbooks(false)
    } catch (e: unknown) {
      console.error('Gagal menghapus e-book:', e)
      setActionError(getErrorMessage(e))
    } finally {
      setDeletingId(null)
    }
  }

  // Pagination (derived, tidak perlu state)
  const totalPages = Math.max(1, Math.ceil(ebooks.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const currentEbooks = ebooks.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text sm:text-[28px]">
            Kelola E-Book
          </h1>
          <p className="text-sm text-tp-muted">
            Tambah dan kelola daftar buku pegangan kurikulum untuk guru.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openModal}
            className="rounded-xl bg-tp-green hover:bg-tp-green-hover text-white text-xs gap-1.5"
          >
            <Plus size={16} /> Tambah E-Book
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchEbooks(true)}
            disabled={loading}
            className="rounded-xl border-tp-border bg-white gap-2 text-xs"
          >
            <RefreshCw size={14} /> Muat Ulang
          </Button>
        </div>
      </div>

      {/* Notifikasi global */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
          <CheckCircle size={18} className="text-tp-green shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}
      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <span className="text-xs font-semibold">{actionError}</span>
        </div>
      )}

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-tp-muted">Memuat data e-book...</div>
        ) : loadError ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-red-700 mb-2">Gagal memuat e-book</p>
            <p className="text-xs text-red-600 mb-3">{loadError}</p>
            <button
              onClick={() => fetchEbooks(true)}
              className="rounded-lg border border-tp-border px-3 py-1.5 text-xs font-semibold text-tp-text hover:bg-gray-50"
            >
              Coba lagi
            </button>
          </div>
        ) : ebooks.length === 0 ? (
          <div className="p-12 text-center text-sm text-tp-muted">
            Belum ada data e-book yang tersimpan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-tp-border bg-gray-50 text-xs font-semibold uppercase tracking-wider text-tp-muted">
                <tr>
                  <th className="px-6 py-4">Judul Buku</th>
                  <th className="px-6 py-4">Jenjang</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {currentEbooks.map((b) => (
                  <tr key={b.id} className="transition hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-tp-text">{b.judul}</td>
                    <td className="px-6 py-4 text-tp-muted">{b.jenjang}</td>
                    <td className="px-6 py-4 text-tp-muted">{b.mata_pelajaran}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-tp-green border border-emerald-200">
                        {b.kategori || 'Kurikulum Merdeka'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          disabled={!b.file_url || !isValidHttpUrl(b.file_url)}
                          className="h-8 rounded-lg text-xs"
                        >
                          <a href={b.file_url} target="_blank" rel="noreferrer">
                            Lihat PDF
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEbook(b.id, b.judul)}
                          disabled={!!deletingId}
                          className="h-8 rounded-lg text-xs gap-1"
                        >
                          <Trash2 size={14} />
                          {deletingId === b.id ? 'Menghapus...' : 'Hapus'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !loadError && ebooks.length > 0 && (
          <div className="flex items-center justify-between border-t border-tp-border bg-gray-50/50 px-6 py-3.5 text-xs text-tp-muted">
            <div>
              Menampilkan{' '}
              <span className="font-semibold text-tp-text">{startIndex + 1}</span> -{' '}
              <span className="font-semibold text-tp-text">
                {Math.min(startIndex + ITEMS_PER_PAGE, ebooks.length)}
              </span>{' '}
              dari <span className="font-semibold text-tp-text">{ebooks.length}</span> e-book
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safePage === 1}
                className="h-8 rounded-lg gap-1 bg-white text-xs"
              >
                <ChevronLeft size={14} /> Sebelumnya
              </Button>
              <span className="font-medium text-tp-text px-1">
                {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safePage === totalPages}
                className="h-8 rounded-lg gap-1 bg-white text-xs"
              >
                Selanjutnya <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-tp-text">Tambah E-Book Baru</h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-1 text-tp-muted hover:bg-gray-100 disabled:opacity-50"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateEbook} className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Judul Buku</Label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Kelas X SMA"
                  value={form.judul}
                  onChange={(e) => setField('judul', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Jenjang</Label>
                  <select
                    className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-tp-text outline-none focus:border-tp-green"
                    value={form.jenjang}
                    onChange={(e) => setField('jenjang', e.target.value)}
                  >
                    {JENJANG_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Mata Pelajaran</Label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Matematika"
                    value={form.mata_pelajaran}
                    onChange={(e) => setField('mata_pelajaran', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Kategori Buku</Label>
                <select
                  className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-tp-text outline-none focus:border-tp-green"
                  value={form.kategori}
                  onChange={(e) => setField('kategori', e.target.value)}
                >
                  <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                  <option value="Kurikulum 2013">Kurikulum 2013</option>
                  <option value="Nonteks">Nonteks (Buku Pengayaan/Literasi)</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">URL File PDF (Link Resmi / Cloudflare R2)</Label>
                <Input
                  type="url"
                  required
                  placeholder="https://..."
                  value={form.file_url}
                  onChange={(e) => setField('file_url', e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">URL Cover Buku (Opsional)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.cover_url}
                  onChange={(e) => setField('cover_url', e.target.value)}
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border-tp-border bg-white text-xs font-semibold text-tp-text hover:bg-gray-50 h-10"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-tp-green hover:bg-tp-green-hover text-white text-xs font-semibold h-10"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan E-Book'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}