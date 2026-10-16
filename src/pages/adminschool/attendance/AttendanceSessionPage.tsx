import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import {
  Plus,
  CheckCircle,
  X,
  Loader2,
  PlayCircle,
  QrCode,
  Users,
  Clock,
  Lock,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface Session {
  id: string
  title: string
  session_date: string
  status: string
  shift_id: string
  shift_name: string
  shift_code: string
  class_group_id: string | null
  class_group_name: string
  class_sub_group_id: string | null
  class_sub_group_name: string
  total_students: number
  total_check_in: number
  total_check_out: number
  total_absent: number
  opened_at: string | null
  closed_at: string | null
}

interface Shift {
  id: string
  name: string
  code: string
  check_in_start: string
  check_in_end: string
}

interface ClassGroup {
  id: string
  name: string
}

interface SubClass {
  id: string
  name: string
  class_group_id: string
}

export default function AttendanceSessionPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [subClasses, setSubClasses] = useState<SubClass[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formShiftID, setFormShiftID] = useState('')
  const [formClassGroupID, setFormClassGroupID] = useState('')
  const [formSubClassID, setFormSubClassID] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formNotes, setFormNotes] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return
      const headers = { Authorization: `Bearer ${token}` }

      const [sessRes, shiftRes, classRes, subClassRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/school-admin/attendance/sessions`, { headers }),
        axios.get(`${API_URL}/api/school-admin/attendance/shifts`, { headers }),
        axios.get(`${API_URL}/api/school-admin/classes`, { headers }),
        axios.get(`${API_URL}/api/school-admin/sub-classes`, { headers }),
      ])

      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data?.sessions ?? [])
      if (shiftRes.status === 'fulfilled') setShifts(shiftRes.value.data?.shifts ?? [])
      if (classRes.status === 'fulfilled') setClassGroups(classRes.value.data?.classes ?? [])
      if (subClassRes.status === 'fulfilled') setSubClasses(subClassRes.value.data?.sub_classes ?? [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const resetForm = () => {
    setFormShiftID('')
    setFormClassGroupID('')
    setFormSubClassID('')
    setFormTitle('')
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormNotes('')
    setFormError('')
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formShiftID) {
      setFormError('Shift wajib dipilih')
      return
    }

    setFormSubmitting(true)
    setFormError('')

    try {
      const token = await getAuthToken()
      if (!token) return

      // Generate title otomatis jika kosong
      let title = formTitle.trim()
      if (!title) {
        const shift = shifts.find((s) => s.id === formShiftID)
        const cls = classGroups.find((c) => c.id === formClassGroupID)
        title = `${shift?.name || 'Shift'} - ${cls?.name || 'Semua Kelas'}`
      }

      await axios.post(
        `${API_URL}/api/school-admin/attendance/sessions`,
        {
          shift_id: formShiftID,
          class_group_id: formClassGroupID || undefined,
          class_sub_group_id: formSubClassID || undefined,
          title,
          session_date: formDate,
          notes: formNotes.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('Sesi berhasil dibuat!')
      setIsModalOpen(false)
      await fetchAll()
    } catch (error: any) {
      setFormError(error.response?.data?.error || error.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleOpenSession = async (sessionId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.post(
        `${API_URL}/api/school-admin/attendance/sessions/${sessionId}/open`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('Sesi berhasil dibuka!')
      await fetchAll()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal membuka sesi')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Tutup sesi ini? Siswa yang belum check-in akan otomatis ditandai ABSEN.')) return

    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await axios.post(
        `${API_URL}/api/school-admin/attendance/sessions/${sessionId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const absentCount = res.data?.absent_count ?? 0
      showSuccess(`Sesi ditutup. ${absentCount} siswa ditandai ABSEN.`)
      await fetchAll()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal menutup sesi')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Yakin hapus sesi ini? Semua record absensi akan hilang.')) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(
        `${API_URL}/api/school-admin/attendance/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('Sesi berhasil dihapus!')
      await fetchAll()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal menghapus')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      scheduled: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-700' },
      open: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700' },
      closed: { label: 'Selesai', color: 'bg-gray-100 text-gray-700' },
      auto_closed: { label: 'Auto-close', color: 'bg-amber-100 text-amber-700' },
      cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
    }
    const b = badges[status] || badges.scheduled
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${b.color}`}>
        {b.label}
      </span>
    )
  }

  const filteredSubClasses = formClassGroupID
    ? subClasses.filter((sc) => sc.class_group_id === formClassGroupID)
    : subClasses

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (isoStr: string | null) => {
    if (!isoStr) return '-'
    return new Date(isoStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Sesi Absensi</h1>
          <p className="text-xs text-tp-muted">
            Buka sesi baru dan kelola absensi siswa per shift.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Buka Sesi Baru
        </Button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-900">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <X size={20} className="text-red-600" />
          <span className="text-xs font-semibold text-red-900">{errorMessage}</span>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-tp-border bg-white shadow-sm">
        {loading ? (
          <p className="text-center text-xs text-tp-muted py-12">Memuat sesi...</p>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <PlayCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-tp-text mb-1">Belum Ada Sesi</p>
            <p>Buka sesi absensi baru untuk memulai.</p>
          </div>
        ) : (
          <div className="divide-y divide-tp-border">
            {sessions.map((sess) => (
              <div key={sess.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-tp-text">{sess.title}</h3>
                      {getStatusBadge(sess.status)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-tp-muted flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon size={11} />
                        {formatDate(sess.session_date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {sess.shift_name} ({sess.shift_code})
                      </span>
                      {sess.class_group_name && (
                        <span>
                          {sess.class_group_name}
                          {sess.class_sub_group_name && ` - ${sess.class_sub_group_name}`}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Users size={11} />
                        <strong>{sess.total_check_in}</strong>/{sess.total_students} hadir
                      </span>
                      {sess.total_absent > 0 && (
                        <span className="text-red-600">
                          <strong>{sess.total_absent}</strong> absen
                        </span>
                      )}
                      {sess.opened_at && (
                        <span className="text-tp-muted">
                          Buka: {formatTime(sess.opened_at)}
                          {sess.closed_at && ` • Tutup: ${formatTime(sess.closed_at)}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {sess.status === 'scheduled' && (
                      <button
                        onClick={() => handleOpenSession(sess.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-tp-green text-white px-3 py-2 text-xs font-medium hover:bg-tp-green-hover"
                        title="Buka Sesi"
                      >
                        <PlayCircle size={14} />
                        Buka
                      </button>
                    )}
                    {(sess.status === 'open' || sess.status === 'scheduled') && (
                      <>
                        <button
                          onClick={() => navigate(`/school-admin/dashboard/attendance/scanner/${sess.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 text-white px-3 py-2 text-xs font-medium hover:bg-blue-600"
                          title="Scan QR"
                        >
                          <QrCode size={14} />
                          Scan
                        </button>
                        <button
                          onClick={() => handleCloseSession(sess.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-white px-3 py-2 text-xs font-medium hover:bg-amber-600"
                          title="Tutup Sesi"
                        >
                          <Lock size={14} />
                          Tutup
                        </button>
                      </>
                    )}
                    {(sess.status === 'closed' || sess.status === 'auto_closed') && (
                      <button
                        onClick={() => navigate(`/school-admin/dashboard/attendance/reports?session=${sess.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 text-tp-text px-3 py-2 text-xs font-medium hover:bg-gray-200"
                        title="Lihat Rekap"
                      >
                        Lihat Rekap
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(sess.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text">Buka Sesi Absensi Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Shift *
                </label>
                <select
                  value={formShiftID}
                  onChange={(e) => setFormShiftID(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                  required
                >
                  <option value="">-- Pilih Shift --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.check_in_start} - {s.check_in_end})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Kelas
                </label>
                <select
                  value={formClassGroupID}
                  onChange={(e) => {
                    setFormClassGroupID(e.target.value)
                    setFormSubClassID('')
                  }}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                >
                  <option value="">-- Semua Kelas --</option>
                  {classGroups.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Sub Kelas (opsional)
                </label>
                <select
                  value={formSubClassID}
                  onChange={(e) => setFormSubClassID(e.target.value)}
                  disabled={!formClassGroupID}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white disabled:bg-gray-50"
                >
                  <option value="">-- Semua Sub Kelas --</option>
                  {filteredSubClasses.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Judul Sesi (opsional)
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Auto-generate jika kosong"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Catatan (opsional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-tp-border">
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
                  Buat Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}