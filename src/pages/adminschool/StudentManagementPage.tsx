import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../components/ui/button'
import {
  Plus,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  Users,
  Pencil,
  ArrowRightLeft,
  Search,
  Filter,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'


interface Student {
  id: string
  full_name: string
  student_number: string
  nisn: string
  is_active: boolean
  created_at: string
  class_sub_group_id: string | null
  sub_class_name: string
  class_group_id: string | null
  class_group_name: string
  class_group_type: string
}

interface SubClassOption {
  id: string
  name: string
  class_group_id: string
  class_group_name: string
  class_group_level: string
  class_group_type: string
  capacity: number
}

interface StudentStat {
  id: string
  name: string
  capacity: number
  class_group_name: string
  student_count: number
}


export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subClassOptions, setSubClassOptions] = useState<SubClassOption[]>([])
  const [stats, setStats] = useState<StudentStat[]>([])

  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [filterSubClassId, setFilterSubClassId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formFullName, setFormFullName] = useState('')
  const [formStudentNumber, setFormStudentNumber] = useState('')
  const [formNISN, setFormNISN] = useState('')
  const [formSubClassId, setFormSubClassId] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [movingStudent, setMovingStudent] = useState<Student | null>(null)
  const [targetSubClassId, setTargetSubClassId] = useState('')
  const [moveSubmitting, setMoveSubmitting] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setErrorMessage('')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setSuccessMessage('')
    setTimeout(() => setErrorMessage(''), 5000)
  }


  const fetchSubClassOptions = useCallback(async () => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await axios.get(
        `${API_URL}/api/school-admin/sub-classes`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const raw = res.data?.sub_classes ?? []
      const options: SubClassOption[] = raw.map((sc: any) => ({
        id: sc.id,
        name: sc.name,
        class_group_id: sc.class_group_id,
        class_group_name: sc.class_group_name,
        class_group_level: sc.class_group_level,
        class_group_type: sc.class_group_type,
        capacity: sc.capacity ?? 0,
      }))
      setSubClassOptions(options)
    } catch (error) {
      console.error('[SubClassOptions] Gagal fetch:', error)
      setSubClassOptions([])
    }
  }, [API_URL])


  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        showError('Sesi login tidak ditemukan.')
        return
      }

      const url = filterSubClassId
        ? `${API_URL}/api/school-admin/students?sub_class_id=${filterSubClassId}`
        : `${API_URL}/api/school-admin/students`

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStudents(res.data?.students ?? [])
    } catch (error: any) {
      console.error('[Students] Gagal fetch:', error)
      setStudents([])
      showError('Gagal memuat data murid.')
    } finally {
      setLoading(false)
    }
  }, [API_URL, filterSubClassId])


  const fetchStats = useCallback(async () => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await axios.get(
        `${API_URL}/api/school-admin/students/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setStats(res.data?.stats ?? [])
    } catch (error) {
      console.error('[Stats] Gagal fetch:', error)
      setStats([])
    }
  }, [API_URL])


  useEffect(() => {
    fetchSubClassOptions()
    fetchStats()
  }, [fetchSubClassOptions, fetchStats])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  
  const handleOpenAddModal = () => {
    setEditingStudent(null)
    setFormFullName('')
    setFormStudentNumber('')
    setFormNISN('')
    setFormSubClassId(filterSubClassId || '')
    setFormError('')
    setIsStudentModalOpen(true)
  }

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student)
    setFormFullName(student.full_name)
    setFormStudentNumber(student.student_number)
    setFormNISN(student.nisn)
    setFormSubClassId(student.class_sub_group_id ?? '')
    setFormError('')
    setIsStudentModalOpen(true)
  }

  const handleOpenMoveModal = (student: Student) => {
    setMovingStudent(student)
    setTargetSubClassId(student.class_sub_group_id ?? '')
    setIsMoveModalOpen(true)
  }

  
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formFullName.trim()) {
      setFormError('Nama murid wajib diisi.')
      return
    }
    if (!formSubClassId) {
      setFormError('Sub kelas wajib dipilih.')
      return
    }

    setFormSubmitting(true)
    setFormError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setFormError('Sesi login tidak ditemukan.')
        return
      }

      if (editingStudent) {
        // Update
        await axios.put(
          `${API_URL}/api/school-admin/students/${editingStudent.id}`,
          {
            full_name: formFullName.trim(),
            student_number: formStudentNumber.trim(),
            nisn: formNISN.trim(),
            class_sub_group_id: formSubClassId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Data murid berhasil diperbarui!')
      } else {
        // Create
        await axios.post(
          `${API_URL}/api/school-admin/students`,
          {
            full_name: formFullName.trim(),
            student_number: formStudentNumber.trim(),
            nisn: formNISN.trim(),
            class_sub_group_id: formSubClassId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Murid berhasil ditambahkan!')
      }

      setIsStudentModalOpen(false)
      await Promise.all([fetchStudents(), fetchStats()])
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Terjadi kesalahan.'
      setFormError(msg)
    } finally {
      setFormSubmitting(false)
    }
  }


  const handleSubmitMove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movingStudent || !targetSubClassId) return

    if (targetSubClassId === movingStudent.class_sub_group_id) {
      showError('Sub kelas tujuan sama dengan sub kelas saat ini.')
      return
    }

    setMoveSubmitting(true)
    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.post(
        `${API_URL}/api/school-admin/students/${movingStudent.id}/move`,
        { target_sub_group_id: targetSubClassId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('Murid berhasil dipindahkan!')
      setIsMoveModalOpen(false)
      await Promise.all([fetchStudents(), fetchStats()])
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message
      showError('Gagal memindahkan murid: ' + msg)
    } finally {
      setMoveSubmitting(false)
    }
  }


  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Yakin ingin menghapus murid ini?')) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(`${API_URL}/api/school-admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      showSuccess('Murid berhasil dihapus!')
      await Promise.all([fetchStudents(), fetchStats()])
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message
      showError('Gagal menghapus murid: ' + msg)
    }
  }


  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.nisn.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q)
    )
  })


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-tp-text">Daftar Murid</h1>
        <p className="text-xs text-tp-muted">
          Distribusi siswa ke sub kelas (rombongan belajar) yang tersedia.
        </p>
      </div>

      {/* Alerts */}
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

      {/* Stats Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((st) => {
            const ratio = st.capacity > 0 ? (st.student_count / st.capacity) * 100 : 0
            const isFull = st.capacity > 0 && st.student_count >= st.capacity
            return (
              <div
                key={st.id}
                className="rounded-2xl border border-tp-border bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold truncate">
                    {st.class_group_name}
                  </span>
                  {isFull && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                      Penuh
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-lg font-bold text-tp-text">
                    {st.student_count}
                  </span>
                  {st.capacity > 0 && (
                    <span className="text-xs text-tp-muted">/ {st.capacity}</span>
                  )}
                </div>
                <p className="text-xs font-medium text-tp-text truncate">{st.name}</p>
                {st.capacity > 0 && (
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-red-500' : ratio > 80 ? 'bg-amber-500' : 'bg-tp-green'
                      }`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-tp-border">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / NISN..."
                className="pl-8 pr-3 py-2 rounded-xl border border-tp-border text-xs outline-none focus:border-tp-green w-48"
              />
            </div>

            {/* Filter Sub Class */}
            <div className="relative">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-muted"
              />
              <select
                value={filterSubClassId}
                onChange={(e) => setFilterSubClassId(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl border border-tp-border text-xs outline-none focus:border-tp-green bg-white appearance-none cursor-pointer"
              >
                <option value="">Semua Sub Kelas</option>
                {subClassOptions.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.class_group_name} - {sc.name}
                  </option>
                ))}
              </select>
            </div>

            {filterSubClassId && (
              <button
                onClick={() => setFilterSubClassId('')}
                className="text-[10px] text-tp-green hover:underline font-medium"
              >
                Reset filter
              </button>
            )}
          </div>

          <Button
            onClick={handleOpenAddModal}
            disabled={subClassOptions.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
          >
            <Plus size={16} />
            Tambah Siswa
          </Button>
        </div>

        {/* Empty State for No Sub Class */}
        {subClassOptions.length === 0 && !loading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs">
            <p className="font-semibold mb-1">Belum ada Sub Kelas</p>
            <p>
              Anda harus membuat sub kelas terlebih dahulu di halaman{' '}
              <strong>Kelola Kelas → Daftar Kelas → Kelola Sub Kelas</strong> sebelum
              menambahkan siswa.
            </p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-center text-xs text-tp-muted py-8">Memuat data siswa...</p>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-tp-text mb-1">
              {students.length === 0 ? 'Belum Ada Siswa' : 'Tidak Ada Data'}
            </p>
            <p>
              {students.length === 0
                ? 'Klik tombol "Tambah Siswa" untuk mendistribusikan siswa ke sub kelas.'
                : 'Coba ubah kata kunci pencarian atau filter.'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-[11px] text-tp-muted">
              Menampilkan <strong>{filteredStudents.length}</strong> dari{' '}
              <strong>{students.length}</strong> siswa
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-tp-border bg-gray-50 text-xs text-tp-muted uppercase tracking-wider">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4">No. Siswa</th>
                    <th className="py-3 px-4">Sub Kelas</th>
                    <th className="py-3 px-4">Master Kelas</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-border">
                  {filteredStudents.map((std, index) => (
                    <tr key={std.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-tp-muted">{index + 1}</td>
                      <td className="py-3 px-4 font-semibold text-tp-text">
                        {std.full_name}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {std.nisn || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {std.student_number || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {std.sub_class_name ? (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {std.sub_class_name}
                          </span>
                        ) : (
                          <span className="text-xs text-tp-muted italic">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-tp-muted">
                        {std.class_group_name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenMoveModal(std)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Pindah Sub Kelas"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(std)}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(std.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>


      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-800 font-medium">
                  {formError}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Contoh: Nama Siswa"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">
                    NISN
                  </label>
                  <input
                    type="text"
                    value={formNISN}
                    onChange={(e) => setFormNISN(e.target.value)}
                    placeholder="10 digit"
                    maxLength={20}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">
                    No. Siswa
                  </label>
                  <input
                    type="text"
                    value={formStudentNumber}
                    onChange={(e) => setFormStudentNumber(e.target.value)}
                    placeholder="Nomor absen (opsional)"
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Distribusi ke Sub Kelas *
                </label>
                <select
                  value={formSubClassId}
                  onChange={(e) => setFormSubClassId(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                  required
                >
                  <option value="">-- Pilih Sub Kelas --</option>
                  {subClassOptions.map((sc) => {
                    const stat = stats.find((s) => s.id === sc.id)
                    const count = stat?.student_count ?? 0
                    const isFull = sc.capacity > 0 && count >= sc.capacity
                    return (
                      <option key={sc.id} value={sc.id} disabled={isFull}>
                        {sc.class_group_name} - {sc.name}
                        {sc.capacity > 0 ? ` (${count}/${sc.capacity})` : ''}
                        {isFull ? ' - PENUH' : ''}
                      </option>
                    )
                  })}
                </select>
                <p className="text-[10px] text-tp-muted mt-1">
                  Hanya sub kelas dengan kapasitas tersedia yang bisa dipilih.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
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
                    : editingStudent
                    ? 'Update Siswa'
                    : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMoveModalOpen && movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-tp-text flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-blue-500" />
                  Pindah Sub Kelas
                </h3>
                <p className="text-[11px] text-tp-muted mt-0.5">
                  {movingStudent.full_name}
                </p>
              </div>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 border border-tp-border">
              <p className="text-[10px] text-tp-muted mb-1">Sub kelas saat ini</p>
              <p className="text-xs font-semibold text-tp-text">
                {movingStudent.sub_class_name || 'Belum ditentukan'}
              </p>
            </div>

            <form onSubmit={handleSubmitMove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Pindah ke Sub Kelas *
                </label>
                <select
                  value={targetSubClassId}
                  onChange={(e) => setTargetSubClassId(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                  required
                >
                  <option value="">-- Pilih Sub Kelas Tujuan --</option>
                  {subClassOptions
                    .filter((sc) => sc.id !== movingStudent.class_sub_group_id)
                    .map((sc) => {
                      const stat = stats.find((s) => s.id === sc.id)
                      const count = stat?.student_count ?? 0
                      const isFull = sc.capacity > 0 && count >= sc.capacity
                      return (
                        <option key={sc.id} value={sc.id} disabled={isFull}>
                          {sc.class_group_name} - {sc.name}
                          {sc.capacity > 0 ? ` (${count}/${sc.capacity})` : ''}
                          {isFull ? ' - PENUH' : ''}
                        </option>
                      )
                    })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={moveSubmitting || !targetSubClassId}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {moveSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {moveSubmitting ? 'Memindahkan...' : 'Pindahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}