import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'
import {
  Calendar,
  Plus,
  Search,
  Filter,
  //Eye,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

type Timetable = {
  id: string
  class_group_id: string | null
  class_sub_group_id: string
  academic_year_id: string
  semester: string
  status: 'draft' | 'active' | 'archived'
  effective_from: string | null
  effective_to: string | null
  notes: string
  created_at: string
  updated_at: string
  class_group_name: string
  class_sub_group_name: string
  academic_year_name: string
}

type AcademicYear = {
  id: string
  name: string
  semester: string
  is_active: boolean
}

type SubClass = {
  id: string
  name: string
  code: string
  class_group_id: string
  class_group_name: string
  class_group_level: string
  class_group_type: string
  academic_year_id: string
  academic_year_name: string
  semester: string
}

export default function TimetableManagementPage() {
  const navigate = useNavigate()

  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [subClasses, setSubClasses] = useState<SubClass[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterAcademicYear, setFilterAcademicYear] = useState('')

  // Modal create
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    class_sub_group_id: '',
    academic_year_id: '',
    notes: '',
  })

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Timetable | null>(null)
  const [deleting, setDeleting] = useState(false)

  const getToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()

      const [ttRes, ayRes, scRes] = await Promise.all([
        axios.get(`${API_URL}/api/school-admin/timetables`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/school-admin/academic-years`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/school-admin/sub-classes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setTimetables(ttRes.data.timetables || [])
      setAcademicYears(ayRes.data.academic_years || [])
      setSubClasses(scRes.data.sub_classes || [])
    } catch (err: any) {
      console.error('Gagal memuat data:', err)
      setError(err.response?.data?.error || err.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTimetables = timetables.filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !t.class_sub_group_name?.toLowerCase().includes(q) &&
        !t.class_group_name?.toLowerCase().includes(q) &&
        !t.academic_year_name?.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    // if (filterSemester && t.semester !== filterSemester) return false
    if (filterAcademicYear && t.academic_year_id !== filterAcademicYear) return false
    return true
  })

  const handleCreate = async () => {
    if (!formData.class_sub_group_id || !formData.academic_year_id) {
      setCreateError('Sub kelas dan tahun akademik wajib diisi')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const token = await getToken()
      const subClass = subClasses.find((s) => s.id === formData.class_sub_group_id)
      
      // Ambil data tahun akademik untuk mendapatkan semesternya
      const selectedAcademicYear = academicYears.find((ay) => ay.id === formData.academic_year_id)

      const res = await axios.post(
        `${API_URL}/api/school-admin/timetables`,
        {
          class_sub_group_id: formData.class_sub_group_id,
          class_group_id: subClass?.class_group_id || '',
          academic_year_id: formData.academic_year_id,
          // Gunakan semester dari tahun akademik yang dipilih
          semester: selectedAcademicYear?.semester || 'Ganjil', 
          notes: formData.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setShowCreate(false)
      setFormData({
        class_sub_group_id: '',
        academic_year_id: '',
        notes: '',
      })

      // Redirect ke editor
      navigate(`/school-admin/dashboard/timetables/${res.data.id}`)
    } catch (err: any) {
      console.error('Gagal membuat jadwal:', err)
      setCreateError(err.response?.data?.error || 'Gagal membuat jadwal')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const token = await getToken()
      await axios.delete(
        `${API_URL}/api/school-admin/timetables/${deleteTarget.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDeleteTarget(null)
      fetchData()
    } catch (err: any) {
      console.error('Gagal menghapus:', err)
      alert(err.response?.data?.error || 'Gagal menghapus jadwal')
    } finally {
      setDeleting(false)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-amber-100 text-amber-700',
      active: 'bg-emerald-100 text-emerald-700',
      archived: 'bg-slate-100 text-slate-600',
    }
    return map[status] || 'bg-slate-100 text-slate-600'
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: 'Draft',
      active: 'Aktif',
      archived: 'Diarsipkan',
    }
    return map[status] || status
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-tp-text sm:text-2xl">
            <Calendar size={24} className="text-tp-green" />
            Jadwal Pelajaran
          </h1>
          <p className="mt-1 text-sm text-tp-muted">
            Kelola jadwal pelajaran per sub-kelas. Tambahkan mapel ke setiap slot hari × jam.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true)
            setCreateError(null)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-tp-green-hover"
        >
          <Plus size={18} />
          Buat Jadwal Baru
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-tp-border bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tp-faint"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari sub kelas / kelas / tahun akademik..."
            className="w-full rounded-xl border border-tp-border bg-tp-bg pl-9 pr-3 py-2 text-sm outline-none focus:border-tp-green"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-tp-muted" />
          {/* <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="rounded-xl border border-tp-border bg-white px-3 py-2 text-sm outline-none focus:border-tp-green"
          >
            <option value="">Semua Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select> */}

          <select
            value={filterAcademicYear}
            onChange={(e) => setFilterAcademicYear(e.target.value)}
            className="rounded-xl border border-tp-border bg-white px-3 py-2 text-sm outline-none focus:border-tp-green"
          >
            <option value="">Semua Tahun</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name} — {ay.semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-tp-border bg-white p-12">
          <Loader2 className="animate-spin text-tp-green" size={28} />
        </div>
      ) : filteredTimetables.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-tp-border bg-white p-12 text-center">
          <Calendar size={48} className="text-tp-faint" />
          <p className="text-sm font-medium text-tp-text">Belum ada jadwal pelajaran</p>
          <p className="text-xs text-tp-muted">
            Klik "Buat Jadwal Baru" untuk memulai menyusun jadwal.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-tp-bg/50 text-left text-xs font-semibold uppercase tracking-wide text-tp-faint">
                <tr>
                  <th className="px-4 py-3">Sub Kelas</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Tahun / Semester</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {filteredTimetables.map((t) => (
                  <tr key={t.id} className="hover:bg-tp-bg/40">
                    <td className="px-4 py-3 font-medium text-tp-text">
                      {t.class_sub_group_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-tp-muted">
                      {t.class_group_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-tp-muted">
                      {t.academic_year_name || '-'} — {t.semester}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(
                          t.status
                        )}`}
                      >
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-tp-muted">
                      {new Date(t.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/school-admin/dashboard/timetables/${t.id}`)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-tp-muted hover:bg-tp-green/10 hover:text-tp-green"
                          title="Lihat / Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(t)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-tp-muted hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== MODAL CREATE ===================== */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !creating && setShowCreate(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => !creating && setShowCreate(false)}
              className="absolute right-4 top-4 text-tp-muted hover:text-tp-text"
            >
              <X size={20} />
            </button>

            <h3 className="mb-1 text-lg font-bold text-tp-text">Buat Jadwal Baru</h3>
            <p className="mb-5 text-sm text-tp-muted">
              Pilih sub kelas dan tahun akademik. Anda dapat menambahkan baris jadwal setelah ini.
            </p>

            {createError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Sub Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.class_sub_group_id}
                  onChange={(e) =>
                    setFormData({ ...formData, class_sub_group_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2.5 text-sm outline-none focus:border-tp-green"
                >
                  <option value="">— Pilih Sub Kelas —</option>
                  {subClasses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class_group_name} — {s.name}
                      {s.code ? ` (${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Tahun Akademik <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.academic_year_id}
                  onChange={(e) =>
                    setFormData({ ...formData, academic_year_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2.5 text-sm outline-none focus:border-tp-green"
                >
                  <option value="">— Pilih Tahun Akademik —</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} — {ay.semester}
                      {ay.is_active ? ' (Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2.5 text-sm outline-none focus:border-tp-green"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div> */}

              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Catatan (opsional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2.5 text-sm outline-none focus:border-tp-green"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-text hover:bg-tp-bg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-60"
              >
                {creating && <Loader2 size={16} className="animate-spin" />}
                {creating ? 'Menyimpan...' : 'Buat Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL DELETE ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-tp-text">Hapus Jadwal?</h3>
            <p className="mb-6 text-sm text-tp-muted">
              Jadwal untuk <strong>{deleteTarget.class_sub_group_name}</strong>{' '}
              ({deleteTarget.academic_year_name} — {deleteTarget.semester}) akan dihapus
              beserta semua baris jadwal di dalamnya. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-text hover:bg-tp-bg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}