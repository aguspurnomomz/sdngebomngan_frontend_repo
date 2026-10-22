import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../components/ui/button'
import {
  //Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  Loader2, 
  Users, 
  //Mail, 
  UserPlus, 
  Search,
  BookOpen,
  Pencil
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

interface Teacher {
  membership_id: string
  teacher_id: string
  user_id: string
  nama_guru: string
  nip_guru: string
  jenis_kelamin: string
  email: string
  role_in_school: string
  is_active: boolean
  teacher_type: string
  joined_at: string
  left_at: string | null
}

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [formPassword, setFormPassword] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formFullName, setFormFullName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formNIP, setFormNIP] = useState('')
  const [formJenisKelamin, setFormJenisKelamin] = useState('')
  const [formRole, setFormRole] = useState('teacher')
  const [formNotes, setFormNotes] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ email: string; password: string } | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null)
  const [editNama, setEditNama] = useState('')
  const [editNIP, setEditNIP] = useState('')
  const [editJenisKelamin, setEditJenisKelamin] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // State untuk modal Atur Mapel
 const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false) 
 const [subjectTeacher, setSubjectTeacher] = useState<Teacher | null>(null)
 const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
 const [selectedSubjectIDs, setSelectedSubjectIDs] = useState<string[]>([])
 const [primarySubjectID, setPrimarySubjectID] = useState<string>('')
 const [subjectModalLoading, setSubjectModalLoading] = useState(false)
 const [subjectModalSaving, setSubjectModalSaving] = useState(false)
 const [subjectModalError, setSubjectModalError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg); setErrorMessage('')
    setTimeout(() => setSuccessMessage(''), 5000)
  }
  const showError = (msg: string) => {
    setErrorMessage(msg); setSuccessMessage('')
    setTimeout(() => setErrorMessage(''), 5000)
  }

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) { showError('Sesi login tidak ditemukan.'); return }

      const res = await axios.get(`${API_URL}/api/school-admin/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTeachers(res.data?.teachers ?? [])
    } catch (error: any) {
      console.error('[Teachers] Gagal fetch:', error)
      setTeachers([])
      showError('Gagal memuat data guru.')
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleOpenAddModal = () => {
    setFormFullName('')
    setFormEmail('')
    setFormPassword('') 
    setFormNIP('')
    setFormJenisKelamin('')
    setFormRole('teacher')
    setFormNotes('')
    setFormError('')
    setTempPasswordInfo(null)
    setIsModalOpen(true)
  }

  const handleSubmitTeacher = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validasi
  if (!formFullName.trim() || !formEmail.trim()) {
    setFormError('Nama dan email wajib diisi.')
    return
  }
  if (!formPassword || formPassword.length < 6) {
    setFormError('Password wajib diisi, minimal 6 karakter.')
    return
  }

  setFormSubmitting(true)
  setFormError('')

  try {
    const token = await getAuthToken()
    if (!token) { setFormError('Sesi login tidak ditemukan.'); return }

    // ✅ Endpoint baru: /teachers (bukan /invite)
    const res = await axios.post(
      `${API_URL}/api/school-admin/teachers`,
      {
        email: formEmail.trim().toLowerCase(),
        full_name: formFullName.trim(),
        password: formPassword,             
        nip: formNIP.trim(),
        jenis_kelamin: formJenisKelamin,
        role_in_school: formRole,
        notes: formNotes.trim(),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    // ==========================================
    // Handler response
    // ==========================================
    if (res.data?.is_new_user === false) {
      // Kasus: email sudah terdaftar di sistem, tapi belum jadi member sekolah ini
      showSuccess(
        'Guru sudah punya akun SkoolaGo. Berhasil ditambahkan ke sekolah tanpa akun baru.'
      )
      setIsModalOpen(false)
      await fetchTeachers()
      return
    }

    // Kasus: user baru berhasil dibuat → tampilkan password untuk di-share
    if (res.data?.password) {
      setTempPasswordInfo({
        email: res.data.email,
        password: res.data.password,
      })
      showSuccess('Guru berhasil ditambahkan. Salin password untuk diberikan ke guru.')
    } else {
      showSuccess('Guru berhasil ditambahkan ke sekolah.')
      setIsModalOpen(false)
    }

    await fetchTeachers()
  } catch (error: any) {
    const msg = error.response?.data?.error || error.message || 'Terjadi kesalahan.'
    setFormError(msg)
  } finally {
    setFormSubmitting(false)
  }
}

  const handleRemoveTeacher = async (membershipId: string, name: string) => {
    if (!confirm(`Yakin ingin mengeluarkan ${name} dari sekolah?`)) return

    const reason = prompt('Alasan mengeluarkan guru (opsional):') || ''

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(`${API_URL}/api/school-admin/teachers/${membershipId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason },
      })

      showSuccess('Guru berhasil dikeluarkan dari sekolah.')
      await fetchTeachers()
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message
      showError('Gagal mengeluarkan guru: ' + msg)
    }
  }

  const handleOpenEditModal = (teacher: Teacher) => {
    setEditTeacher(teacher)
    setEditNama(teacher.nama_guru)
    setEditNIP(teacher.nip_guru || '')
    setEditJenisKelamin(teacher.jenis_kelamin || '')
    setEditError('')
    setIsEditModalOpen(true)
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTeacher) return

    setEditSubmitting(true)
    setEditError('')

    try {
      const token = await getAuthToken()
      if (!token) { setEditError('Sesi login tidak ditemukan.'); return }

      await axios.put(
        `${API_URL}/api/school-admin/teachers/${editTeacher.teacher_id}`,
        {
          nama_guru: editNama.trim(),
          nip: editNIP.trim(),
          jenis_kelamin: editJenisKelamin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('Data guru berhasil diperbarui.')
      setIsEditModalOpen(false)
      await fetchTeachers()
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Terjadi kesalahan.'
      setEditError(msg)
    } finally {
      setEditSubmitting(false)
    }
  }

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      t.nama_guru.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.nip_guru.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex)

  const activeTeachers = filteredTeachers.filter(t => t.is_active)
  const inactiveTeachers = filteredTeachers.filter(t => !t.is_active)

  const handleOpenSubjectModal = async (t: Teacher) => {
  setSubjectTeacher(t)
  setSubjectModalLoading(true)
  setSubjectModalError('')
  setSelectedSubjectIDs([])
  setPrimarySubjectID('')

  try {
    const token = await getAuthToken()
    if (!token) { setSubjectModalError('Sesi login tidak ditemukan.'); return }

    // Fetch semua mapel aktif + mapel yang sudah diampu guru ini
    const [allRes, assignedRes] = await Promise.all([
      axios.get(`${API_URL}/api/school-admin/subjects?is_active=true`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_URL}/api/school-admin/teachers/${t.teacher_id}/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    setAvailableSubjects(allRes.data?.subjects ?? [])

    const assigned = assignedRes.data?.subjects ?? []
    setSelectedSubjectIDs(assigned.map((s: any) => s.subject_id))

    const primary = assigned.find((s: any) => s.is_primary)
    if (primary) setPrimarySubjectID(primary.subject_id)

    setIsSubjectModalOpen(true)
  } catch (error: any) {
    const msg = error.response?.data?.error || error.message || 'Gagal memuat data mapel.'
    setSubjectModalError(msg)
    setIsSubjectModalOpen(true)
  } finally {
    setSubjectModalLoading(false)
  }
}

const handleSaveSubjects = async () => {
  if (!subjectTeacher) return
  if (selectedSubjectIDs.length === 0) {
    setSubjectModalError('Pilih minimal 1 mapel.')
    return
  }

  setSubjectModalSaving(true)
  setSubjectModalError('')

  try {
    const token = await getAuthToken()
    if (!token) { setSubjectModalError('Sesi login tidak ditemukan.'); return }

    await axios.post(
      `${API_URL}/api/school-admin/teachers/${subjectTeacher.teacher_id}/subjects`,
      {
        subject_ids: selectedSubjectIDs,
        is_primary: primarySubjectID || '',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    showSuccess(`Mapel untuk ${subjectTeacher.nama_guru} berhasil disimpan.`)
    setIsSubjectModalOpen(false)
  } catch (error: any) {
    const msg = error.response?.data?.error || error.message || 'Terjadi kesalahan.'
    setSubjectModalError(msg)
  } finally {
    setSubjectModalSaving(false)
  }
}

const handleToggleSubject = (subjectID: string) => {
  if (selectedSubjectIDs.includes(subjectID)) {
    setSelectedSubjectIDs(selectedSubjectIDs.filter(id => id !== subjectID))
    if (primarySubjectID === subjectID) setPrimarySubjectID('')
  } else {
    setSelectedSubjectIDs([...selectedSubjectIDs, subjectID])
  }
}

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Manajemen Guru</h1>
          <p className="text-xs text-tp-muted">
            Kelola guru yang terdaftar di sekolah Anda.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <UserPlus size={16} />
          Tambah Guru
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-tp-border bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">Total Guru</p>
          <p className="text-2xl font-bold text-tp-text mt-1">{teachers.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">Aktif</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{activeTeachers.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Tidak Aktif</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{inactiveTeachers.length}</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-tp-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / email / NIP..."
              className="pl-8 pr-3 py-2 rounded-xl border border-tp-border text-xs outline-none focus:border-tp-green w-64"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-xs text-tp-muted py-8">Memuat data guru...</p>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-tp-text mb-1">
              {teachers.length === 0 ? 'Belum Ada Guru' : 'Tidak Ada Hasil'}
            </p>
            <p>
              {teachers.length === 0
                ? 'Klik "Tambah Guru" untuk menambahkan Guru.'
                : 'Coba ubah kata kunci pencarian.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-tp-border bg-gray-50 text-xs text-tp-muted uppercase tracking-wider">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {paginatedTeachers.map((t, index) => (
                  <tr key={t.membership_id} className="hover:bg-gray-50">
                     <td className="py-3 px-4 text-tp-muted">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-tp-text">{t.nama_guru || '-'}</td>
                    <td className="py-3 px-4">
                      {t.jenis_kelamin === 'L' ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">L</span>
                      ) : t.jenis_kelamin === 'P' ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold">P</span>
                      ) : (
                        <span className="text-xs text-tp-muted italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">{t.email || '-'}</td>
                    <td className="py-3 px-4 text-xs font-mono">{t.nip_guru || '-'}</td>
                   <td className="py-3 px-4">
                    {t.is_active ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Aktif</span>
                    ) : (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Nonaktif</span>
                    )}
                    </td>
                    <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                                          <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Tombol Edit */}
                        <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Data Guru"
                          >
                          <Pencil size={14} />
                        </button>
                      </div>
                      </td>
                        {/* Tombol Atur Mapel */}
                        <button
                        onClick={() => handleOpenSubjectModal(t)}
                        className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Atur Mapel"
                        >
                        <BookOpen size={14} />
                        </button>

                        {/* Tombol Hapus */}
                        {t.is_active && (
                        <button
                            onClick={() => handleRemoveTeacher(t.teacher_id, t.nama_guru)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Keluarkan dari sekolah"
                        >
                            <Trash2 size={14} />
                        </button>
                        )}
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-tp-border mt-4">
              <p className="text-[11px] text-tp-muted">
                Halaman <strong>{currentPage}</strong> dari <strong>{totalPages || 1}</strong>
                {' · '}Menampilkan <strong>{filteredTeachers.length === 0 ? 0 : startIndex + 1}</strong>–
                <strong>{Math.min(endIndex, filteredTeachers.length)}</strong> dari{' '}
                <strong>{filteredTeachers.length}</strong> guru
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
      {/* Modal Atur Mapel */}
      {isSubjectModalOpen && subjectTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
                <div>
                <h3 className="text-sm font-bold text-tp-text flex items-center gap-2">
                    <BookOpen size={16} className="text-purple-500" />
                    Atur Mata Pelajaran
                </h3>
                <p className="text-[11px] text-tp-muted mt-0.5">{subjectTeacher.nama_guru}</p>
                </div>
                <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
                >
                <X size={18} />
                </button>
            </div>

            {subjectModalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-800 font-medium">{subjectModalError}</span>
                </div>
            )}

            {subjectModalLoading ? (
                <p className="text-center text-xs text-tp-muted py-6">Memuat mapel...</p>
            ) : availableSubjects.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs">
                <p className="font-semibold text-amber-900 mb-1">Belum ada Mata Pelajaran</p>
                <p className="text-amber-800">
                    Tambahkan mapel dulu di menu <strong>Mata Pelajaran</strong>.
                </p>
                </div>
            ) : (
                <>
                <div className="text-[11px] text-tp-muted">
                    Pilih mapel yang diampu. Centang untuk memilih, klik <strong>Bintang</strong> untuk
                    menandai mapel utama.
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {availableSubjects.map((sub) => {
                    const isSelected = selectedSubjectIDs.includes(sub.id)
                    const isPrimary = primarySubjectID === sub.id
                    return (
                        <div
                        key={sub.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            isSelected
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-tp-border bg-white hover:bg-gray-50'
                        }`}
                        >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSubject(sub.id)}
                            className="rounded cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-tp-text truncate">
                            {sub.name}
                            </div>
                            {sub.code && (
                            <div className="text-[10px] text-tp-muted font-mono">{sub.code}</div>
                            )}
                        </div>
                        {isSelected && (
                            <button
                            type="button"
                            onClick={() => setPrimarySubjectID(isPrimary ? '' : sub.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                                isPrimary
                                ? 'text-yellow-500 bg-yellow-50'
                                : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'
                            }`}
                            title={isPrimary ? 'Mapel Utama' : 'Jadikan Mapel Utama'}
                            >
                            ★
                            </button>
                        )}
                        </div>
                    )
                    })}
                </div>

                <div className="text-[10px] text-tp-muted pt-2 border-t border-tp-border">
                    {selectedSubjectIDs.length} mapel dipilih
                    {primarySubjectID && ' • 1 mapel utama ditandai'}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                    type="button"
                    onClick={() => setIsSubjectModalOpen(false)}
                    className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50"
                    >
                    Batal
                    </button>
                    <button
                    onClick={handleSaveSubjects}
                    disabled={subjectModalSaving || selectedSubjectIDs.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
                    >
                    {subjectModalSaving && <Loader2 size={14} className="animate-spin" />}
                    {subjectModalSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
                </>
            )}
            </div>
        </div>
      )}

      {/* Modal Tambah Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text flex items-center gap-2">
                <UserPlus size={16} className="text-tp-green" />
                Tambah Guru Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-tp-muted hover:text-tp-text">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-800 font-medium">{formError}</span>
              </div>
            )}

            {tempPasswordInfo ? (
                <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-bold text-emerald-900 mb-2">
                        ✅ Guru Berhasil Ditambahkan
                    </p>
                    <p className="text-[11px] text-emerald-800 mb-3">
                        Salin data login berikut dan kirim ke guru via WhatsApp/SMS.
                        Password ini hanya ditampilkan <strong>sekali</strong>.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-emerald-300 font-mono text-sm">
                        <div className="text-[10px] text-gray-500 mb-1">Email:</div>
                        <div className="mb-2 select-all break-all">{tempPasswordInfo.email}</div>
                        <div className="text-[10px] text-gray-500 mb-1">Password:</div>
                        <div className="select-all font-bold text-tp-green break-all">{tempPasswordInfo.password}</div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                        Sarankan guru untuk segera ganti password setelah login pertama kali.
                    </p>
                    </div>

                    <button
                    type="button"
                    onClick={() => {
                        const text = `Halo! Akun SkoolaGo Anda sudah dibuat.\n\nEmail: ${tempPasswordInfo.email}\nPassword: ${tempPasswordInfo.password}\n\nSilakan login dan ganti password setelah masuk pertama kali.`
                        navigator.clipboard.writeText(text)
                        showSuccess('Data login tersalin ke clipboard!')
                    }}
                    className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                    📋 Copy Email & Password
                    </button>

                    <button
                    onClick={() => {
                        setIsModalOpen(false)
                        setTempPasswordInfo(null)
                        setFormPassword('')
                    }}
                    className="w-full rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
                    >
                    Selesai
                    </button>
                </div>
            ): (
              <form onSubmit={handleSubmitTeacher} className="space-y-4">
                {/* 1. Nama Lengkap */}
                <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">Nama Lengkap *</label>
                    <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Contoh: Nama Guru"
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                    required autoFocus
                    />
                </div>

                {/* 2. Email */}
                <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">Email *</label>
                    <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="guru@email.com"
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                    required
                    />
                    <p className="text-[10px] text-tp-muted mt-1">Email akan dipakai untuk login.</p>
                </div>

                {/* 3. Password + Generate */}
                <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">
                    Password Awal *
                    </label>
                    <div className="flex gap-2">
                    <input
                        type="text"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        minLength={6}
                        className="flex-1 rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green font-mono"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
                        let pwd = ''
                        for (let i = 0; i < 10; i++) {
                            pwd += chars.charAt(Math.floor(Math.random() * chars.length))
                        }
                        setFormPassword(pwd)
                        }}
                        className="rounded-xl border border-tp-border bg-white px-3 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50 whitespace-nowrap"
                        title="Generate password acak"
                    >
                        Generate
                    </button>
                    </div>
                    <p className="text-[10px] text-tp-muted mt-1">
                    Guru akan login dengan email + password ini.
                    </p>
                </div>

                {/* 4. NIP + Jenis Kelamin */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">NIP</label>
                    <input
                        type="text"
                        value={formNIP}
                        onChange={(e) => setFormNIP(e.target.value)}
                        placeholder="Opsional"
                        className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green font-mono"
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">Jenis Kelamin</label>
                    <div className="flex gap-2">
                        <button
                        type="button"
                        onClick={() => setFormJenisKelamin('L')}
                        className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                            formJenisKelamin === 'L'
                            ? 'border-tp-green bg-tp-green text-white'
                            : 'border-tp-border bg-white text-tp-muted'
                        }`}
                        >
                        L
                        </button>
                        <button
                        type="button"
                        onClick={() => setFormJenisKelamin('P')}
                        className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                            formJenisKelamin === 'P'
                            ? 'border-pink-500 bg-pink-500 text-white'
                            : 'border-tp-border bg-white text-tp-muted'
                        }`}
                        >
                        P
                        </button>
                    </div>
                    </div>
                </div>

                {/* 5. Peran */}
                <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">Peran di Sekolah</label>
                    <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                    >
                    <option value="teacher">Guru</option>
                    <option value="homeroom_teacher">Wali Kelas</option>
                    <option value="vice_principal">Wakil Kepala Sekolah</option>
                    </select>
                </div>

                {/* 6. Catatan */}
                <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">Catatan</label>
                    <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Catatan tambahan (opsional)"
                    rows={2}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green resize-none"
                    />
                </div>

                {/* Action buttons */}
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
                    {formSubmitting ? 'Menyimpan...' : 'Simpan Guru'}
                    </button>
                </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Edit Guru */}
      {isEditModalOpen && editTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text flex items-center gap-2">
                <Pencil size={16} className="text-blue-500" />
                Edit Data Guru
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-tp-muted hover:text-tp-text">
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-800 font-medium">{editError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Email (Tidak dapat diubah)</label>
                <input
                  type="text"
                  value={editTeacher.email}
                  disabled
                  className="w-full rounded-xl border border-tp-border bg-gray-100 px-3.5 py-2.5 text-sm outline-none text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">NIP</label>
                  <input
                    type="text"
                    value={editNIP}
                    onChange={(e) => setEditNIP(e.target.value)}
                    placeholder="Opsional"
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditJenisKelamin('L')}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                        editJenisKelamin === 'L'
                          ? 'border-tp-green bg-tp-green text-white'
                          : 'border-tp-border bg-white text-tp-muted'
                      }`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditJenisKelamin('P')}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                        editJenisKelamin === 'P'
                          ? 'border-pink-500 bg-pink-500 text-white'
                          : 'border-tp-border bg-white text-tp-muted'
                      }`}
                    >
                      P
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {editSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}