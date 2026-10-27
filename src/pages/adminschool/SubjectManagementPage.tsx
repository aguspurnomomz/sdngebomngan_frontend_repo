import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../components/ui/button'
import {
  Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  Loader2,
  BookOpen, 
  Pencil, 
  Search, 
  Power, 
  PowerOff,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

interface Subject {
  id: string
  name: string
  code: string
  description: string
  category: 'wajib' | 'mulok' | 'pilihan'
  is_active: boolean
  created_at: string
  updated_at: string
  teacher_count: number
}

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<'wajib' | 'mulok' | 'pilihan'>('wajib')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg); setErrorMessage('')
    setTimeout(() => setSuccessMessage(''), 4000)
  }
  const showError = (msg: string) => {
    setErrorMessage(msg); setSuccessMessage('')
    setTimeout(() => setErrorMessage(''), 5000)
  }

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) { showError('Sesi login tidak ditemukan.'); return }

      const url = `${API_URL}/api/school-admin/subjects${showInactive ? '' : '?is_active=true'}`
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSubjects(res.data?.subjects ?? [])
    } catch (error: any) {
      console.error('[Subjects] Gagal fetch:', error)
      setSubjects([])
      showError('Gagal memuat data mata pelajaran.')
    } finally {
      setLoading(false)
    }
  }, [API_URL, showInactive])

  useEffect(() => { fetchSubjects() }, [fetchSubjects])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCategory, showInactive])

  const handleOpenAddModal = () => {
    setEditingSubject(null)
    setFormName('')
    setFormCode('')
    setFormDescription('')
    setFormCategory('wajib') 
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (s: Subject) => {
    setEditingSubject(s)
    setFormName(s.name)
    setFormCode(s.code)
    setFormDescription(s.description)
    setFormCategory(s.category || 'wajib')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Nama mapel wajib diisi.')
      return
    }

    setFormSubmitting(true)
    setFormError('')

    try {
      const token = await getAuthToken()
      if (!token) { setFormError('Sesi login tidak ditemukan.'); return }

      if (editingSubject) {
        await axios.put(
          `${API_URL}/api/school-admin/subjects/${editingSubject.id}`,
          {
            name: formName.trim(),
            code: formCode.trim(),
            description: formDescription.trim(),
            category: formCategory,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Mapel berhasil diperbarui!')
      } else {
        await axios.post(
          `${API_URL}/api/school-admin/subjects`,
          {
            name: formName.trim(),
            code: formCode.trim(),
            description: formDescription.trim(),
            category: formCategory,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Mapel berhasil ditambahkan!')
      }

      setIsModalOpen(false)
      await fetchSubjects()
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Terjadi kesalahan.'
      setFormError(msg)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleActive = async (s: Subject) => {
    const newStatus = !s.is_active
    const action = newStatus ? 'mengaktifkan' : 'menonaktifkan'
    if (!confirm(`Yakin ingin ${action} mapel "${s.name}"?`)) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.put(
        `${API_URL}/api/school-admin/subjects/${s.id}`,
        { is_active: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess(`Mapel berhasil di${newStatus ? 'aktifkan' : 'nonaktifkan'}.`)
      await fetchSubjects()
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message
      showError(`Gagal ${action} mapel: ${msg}`)
    }
  }

  const handleDeleteSubject = async (s: Subject) => {
    if (s.teacher_count > 0) {
      showError(`Tidak bisa hapus: masih diampu oleh ${s.teacher_count} guru. Hapus relasi dulu.`)
      return
    }
    if (!confirm(`Hapus mapel "${s.name}"? (Akan dinonaktifkan, bukan dihapus permanen)`)) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(`${API_URL}/api/school-admin/subjects/${s.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      showSuccess('Mapel berhasil dinonaktifkan.')
      await fetchSubjects()
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message
      showError('Gagal menghapus mapel: ' + msg)
    }
  }

  const filtered = subjects.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedSubjects = filtered.slice(startIndex, endIndex)

  const activeCount = filtered.filter(s => s.is_active).length
  const inactiveCount = filtered.filter(s => !s.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Mata Pelajaran</h1>
          <p className="text-xs text-tp-muted">
            Kelola daftar mata pelajaran.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Tambah Mapel
        </Button>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
          <CheckCircle size={20} className="text-tp-green shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-center gap-3">
          <X size={20} className="text-red-500 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-tp-border bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">Total</p>
          <p className="text-2xl font-bold text-tp-text mt-1">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">Aktif</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Nonaktif</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{inactiveCount}</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-tp-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / kode mapel..."
              className="pl-8 pr-3 py-2 rounded-xl border border-tp-border text-xs outline-none focus:border-tp-green w-64"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-tp-border text-xs outline-none focus:border-tp-green bg-white"
          >
            <option value="">Semua Kategori</option>
            <option value="wajib">Wajib</option>
            <option value="mulok">Mulok</option>
            <option value="pilihan">Pilihan</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-tp-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Tampilkan yang nonaktif
          </label>
        </div>

        {loading ? (
          <p className="text-center text-xs text-tp-muted py-8">Memuat data mapel...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-tp-text mb-1">
              {subjects.length === 0 ? 'Belum Ada Mapel' : 'Tidak Ada Hasil'}
            </p>
            <p>
              {subjects.length === 0
                ? 'Klik "Tambah Mapel" untuk menambahkan mata pelajaran pertama.'
                : 'Coba ubah kata kunci pencarian.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-tp-border bg-gray-50 text-xs text-tp-muted uppercase tracking-wider">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Mapel</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Kategori</th> 
                  <th className="py-3 px-4">Guru Pengampu</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {paginatedSubjects.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-tp-muted">{startIndex + idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-tp-text">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-tp-muted truncate max-w-xs mt-0.5">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {s.code || '-'}
                    </td>
                    <td className="py-3 px-4">           
                      {s.category === 'wajib' && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          Wajib
                        </span>
                      )}
                      {s.category === 'mulok' && (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                          Mulok
                        </span>
                      )}
                      {s.category === 'pilihan' && (
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                          Pilihan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {s.teacher_count} guru
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`p-2 rounded-lg transition-colors ${
                            s.is_active
                              ? 'text-gray-500 hover:bg-gray-100'
                              : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {s.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(s)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                          title="Hapus"
                          disabled={s.teacher_count > 0}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-tp-border mt-4">
              <p className="text-[11px] text-tp-muted">
                Halaman <strong>{currentPage}</strong> dari <strong>{totalPages || 1}</strong>
                {' · '}Menampilkan <strong>{filtered.length === 0 ? 0 : startIndex + 1}</strong>–
                <strong>{Math.min(endIndex, filtered.length)}</strong> dari{' '}
                <strong>{filtered.length}</strong> mapel
              </p>

              <div className="flex items-center gap-1">
                {/* Tombol Prev */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-tp-border bg-white px-3 py-1.5 text-xs font-semibold text-tp-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>

                {/* Nomor Halaman */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    )
                  })
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1]
                    const showEllipsis = prevPage && page - prevPage > 1

                    return (
                      <span key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-1 text-xs text-tp-muted">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            currentPage === page
                              ? 'bg-tp-green text-white'
                              : 'border border-tp-border bg-white text-tp-text hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    )
                  })}

                {/* Tombol Next */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="rounded-lg border border-tp-border bg-white px-3 py-1.5 text-xs font-semibold text-tp-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text flex items-center gap-2">
                <BookOpen size={16} className="text-tp-green" />
                {editingSubject ? 'Edit Mapel' : 'Tambah Mapel Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-800 font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Matematika"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Kode Mapel
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: MTK"
                  maxLength={10}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green font-mono uppercase"
                />
                <p className="text-[10px] text-tp-muted mt-1">
                  Opsional. Kode singkat untuk laporan/nilai.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Kategori *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as 'wajib' | 'mulok' | 'pilihan')}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                  required
                >
                  <option value="wajib">Wajib (Kurikulum Nasional)</option>
                  <option value="mulok">Muatan Lokal (Mulok)</option>
                  <option value="pilihan">Pilihan (Ekstrakurikuler)</option>
                </select>
                <p className="text-[10px] text-tp-muted mt-1">
                  Wajib: Pancasila, Matematika, IPAS, dll. Mulok: Bahasa Daerah, BTQ, PLBJ. Pilihan: Bahasa Inggris, Koding.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Deskripsi singkat (opsional)"
                  rows={3}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {formSubmitting
                    ? 'Menyimpan...'
                    : editingSubject
                    ? 'Update Mapel'
                    : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}