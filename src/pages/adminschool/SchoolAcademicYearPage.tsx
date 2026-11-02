import { useState, useEffect, useRef } from 'react'
import { Button } from '../../components/ui/button'
import { Calendar, Plus, CheckCircle, AlertCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

type AcademicYear = {
  id: string
  name: string
  semester: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
}

type Semester = 'Ganjil' | 'Genap'

type AcademicYearForm = {
  name: string
  semester: Semester
  start_date: string
  end_date: string
}

const EMPTY_FORM: AcademicYearForm = {
  name: '',
  semester: 'Ganjil',
  start_date: '',
  end_date: '',
}

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as any)?.error || e.message
  }
  if (e instanceof Error) return e.message
  return String(e)
}

// Format ISO date mis "1 Juli 2026"
function formatDateId(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function validateForm(form: AcademicYearForm): string | null {
  if (!form.name.trim()) return 'Nama tahun ajaran wajib diisi.'
  if (!/^\d{4}\/\d{4}$/.test(form.name.trim())) {
    return 'Format nama tahun ajaran harus "YYYY/YYYY", contoh: 2026/2027.'
  }
  if (form.start_date && form.end_date && form.start_date > form.end_date) {
    return 'Tanggal mulai tidak boleh setelah tanggal selesai.'
  }
  return null
}

export default function SchoolAcademicYearPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<AcademicYearForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const API_URL = import.meta.env.VITE_API_URL
  const successTimerRef = useRef<number | null>(null)

  const setField = <K extends keyof AcademicYearForm>(
    key: K,
    value: AcademicYearForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const getAuthToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Sesi tidak valid. Silakan login ulang.')
    }
    return session.access_token
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => setSuccessMessage(''), 4000)
  }

  // showLoading=false untuk refetch tanpa flicker
  const fetchAcademicYears = async (showLoading = true) => {
    try {
      if (showLoading) setIsFetching(true)
      setLoadError('')
      const token = await getAuthToken()
      const res = await axios.get(`${API_URL}/api/school-admin/academic-years`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAcademicYears(res.data.academic_years || [])
    } catch (e: unknown) {
      console.error('Gagal memuat tahun akademik:', e)
      setLoadError(getErrorMessage(e))
    } finally {
      if (showLoading) setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchAcademicYears(true)
  }, [API_URL])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    }
  }, [])

  const openModal = () => {
    setForm(EMPTY_FORM) 
    setFormError('')
    setActionError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (loading) return 
    setIsModalOpen(false)
    setFormError('')
  }

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setLoading(true)
      setFormError('')
      setActionError('')
      const token = await getAuthToken()
      await axios.post(
        `${API_URL}/api/school-admin/academic-years`,
        {
          name: form.name.trim(),
          semester: form.semester,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setIsModalOpen(false)
      setForm(EMPTY_FORM)
      showSuccess('Tahun akademik berhasil ditambahkan.')
      await fetchAcademicYears(false) // await & tanpa flicker
    } catch (e: unknown) {
      console.error('Gagal menambah tahun akademik:', e)
      setFormError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const setActiveYear = async (id: string) => {
    if (activatingId) return // cegah double-click
    if (!window.confirm('Aktifkan tahun akademik ini? Seluruh aktivitas sekolah akan mengacu pada periode ini.')) {
      return
    }

    try {
      setActivatingId(id)
      setActionError('')
      const token = await getAuthToken()
      await axios.patch(
        `${API_URL}/api/school-admin/academic-years/${id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
   
      setAcademicYears((prev) =>
        prev.map((y) => ({ ...y, is_active: y.id === id }))
      )
      showSuccess('Tahun akademik berhasil diaktifkan.')
    } catch (e: unknown) {
      console.error('Gagal mengubah status aktif:', e)
      setActionError(getErrorMessage(e))
    } finally {
      setActivatingId(null)
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Tahun Akademik Sekolah</h1>
          <p className="text-xs text-tp-muted">
            Kelola periode tahun ajaran dan semester aktif untuk institusi Anda.
          </p>
        </div>
        <Button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Tambah Tahun Akademik
        </Button>
      </div>

      {/* Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-blue-900 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold mb-0.5">Catatan Penting Pengaturan Akademik</p>
          Tahun akademik yang berstatus <strong className="text-blue-700">Aktif</strong> akan
          menjadi acuan utama bagi seluruh aktifitas di sekolah Anda.
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
      <div className="rounded-2xl border border-tp-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tp-border bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-tp-muted">
                <th className="px-6 py-3.5">Nama Tahun Ajaran</th>
                <th className="px-6 py-3.5">Semester</th>
                <th className="px-6 py-3.5">Rentang Tanggal</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border text-sm">
              {isFetching ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-tp-muted">
                    Memuat data tahun akademik...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-sm font-semibold text-red-700 mb-2">
                      Gagal memuat data tahun akademik
                    </p>
                    <p className="text-xs text-red-600 mb-3">{loadError}</p>
                    <button
                      onClick={() => fetchAcademicYears(true)}
                      className="rounded-lg border border-tp-border px-3 py-1.5 text-xs font-semibold text-tp-text hover:bg-gray-50"
                    >
                      Coba lagi
                    </button>
                  </td>
                </tr>
              ) : academicYears.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-tp-muted">
                    Belum ada data tahun akademik yang dibuat. Silakan tambahkan tahun akademik.
                  </td>
                </tr>
              ) : (
                academicYears.map((item) => (
                  <tr key={item.id} className="transition hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-tp-text">
                      <div className="flex items-center gap-2.5">
                        <Calendar size={16} className="text-tp-green shrink-0" />
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-tp-muted">{item.semester}</td>
                    <td className="px-6 py-4 text-xs text-tp-muted">
                      {formatDateId(item.start_date)} s/d {formatDateId(item.end_date)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                          <CheckCircle size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!item.is_active && (
                        <button
                          type="button"
                          onClick={() => setActiveYear(item.id)}
                          disabled={!!activatingId || loading}
                          className="rounded-lg border border-tp-border px-3 py-1.5 text-xs font-semibold text-tp-text transition hover:bg-tp-green/10 hover:text-tp-green disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {activatingId === item.id ? 'Mengaktifkan...' : 'Jadikan Aktif'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-bold text-tp-text">Tambah Tahun Akademik Baru</h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg p-1 text-tp-muted hover:bg-gray-100 disabled:opacity-50"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1.5">
                  Nama Tahun Ajaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2026/2027"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1.5">
                  Semester
                </label>
                <select
                  value={form.semester}
                  onChange={(e) => setField('semester', e.target.value as Semester)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green bg-white"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setField('start_date', e.target.value)}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2 text-sm text-tp-text outline-none focus:border-tp-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setField('end_date', e.target.value)}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2 text-sm text-tp-text outline-none focus:border-tp-green"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}