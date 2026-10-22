import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  UserCog,
  MapPin,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const DAYS = [
  { id: 1, label: 'Senin' },
  { id: 2, label: 'Selasa' },
  { id: 3, label: 'Rabu' },
  { id: 4, label: 'Kamis' },
  { id: 5, label: 'Jumat' },
  { id: 6, label: 'Sabtu' },
]

const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1)

type Entry = {
  id: string
  day_of_week: number
  period_start: number
  period_end: number
  subject_id: string | null
  subject_name_snapshot: string
  teacher_id: string | null
  teacher_name: string
  room: string
  notes: string
}

type TimetableHeader = {
  id: string
  class_sub_group_id: string
  academic_year_id: string
  semester: string
  status: string
  notes: string
}

type Subject = {
  id: string
  name: string
  code: string
}

type Teacher = {
  teacher_id: string
  user_id: string
  nama_guru: string
}

type Conflict = {
  day: number
  period: string
  teacher: string
  message: string
}

type TimeSlot = {
  period_number: number
  start_time: string
  end_time: string
  is_break: boolean
}



export default function TimetableEditorPage() {
  const navigate = useNavigate()
  const { timetableId } = useParams<{ timetableId: string }>()

  const [header, setHeader] = useState<TimetableHeader | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit cell modal
  const [editing, setEditing] = useState<{
    day: number
    period: number
    entry: Entry | null
  } | null>(null)

  const [form, setForm] = useState({
    subject_id: '',
    teacher_id: '',
    room: '',
    notes: '',
    period_span: 1,
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Validation
  const [validating, setValidating] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  const getToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  const fetchData = async () => {
    if (!timetableId) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [ttRes, subjRes, teachRes] = await Promise.all([
        axios.get(`${API_URL}/api/school-admin/timetables/${timetableId}`, {
          headers,
        }),
        axios.get(`${API_URL}/api/school-admin/subjects?is_active=true`, {
          headers,
        }),
        axios.get(`${API_URL}/api/school-admin/teachers`, { headers }),
      ])

      setHeader(ttRes.data.timetable)
      setEntries(ttRes.data.entries || [])
      setSubjects(subjRes.data.subjects || [])
      setTeachers(teachRes.data.teachers || [])
      setTimeSlots(ttRes.data.time_slots || [])
    } catch (err: any) {
      console.error('Gagal memuat jadwal:', err)
      setError(err.response?.data?.error || 'Gagal memuat jadwal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetableId])

  // Map entries ke grid: key = `${day}-${period}`
  const grid = useMemo(() => {
    const map: Record<string, Entry | null> = {}
    for (const day of DAYS) {
      for (const p of PERIODS) {
        map[`${day.id}-${p}`] = null
      }
    }
    for (const e of entries) {
      for (let p = e.period_start; p <= e.period_end; p++) {
        map[`${e.day_of_week}-${p}`] = e
      }
    }
    return map
  }, [entries])

  const openEditCell = (day: number, period: number) => {
    const existing = grid[`${day}-${period}`]
    setEditing({ day, period, entry: existing })
    setSaveError(null)

    if (existing) {
      setForm({
        subject_id: existing.subject_id || '',
        teacher_id: existing.teacher_id || '',
        room: existing.room || '',
        notes: existing.notes || '',
        period_span: existing.period_end - existing.period_start + 1,
      })
    } else {
      setForm({
        subject_id: '',
        teacher_id: '',
        room: '',
        notes: '',
        period_span: 1,
      })
    }
  }

  const handleSaveCell = async () => {
    if (!editing) return
    if (!form.subject_id) {
      setSaveError('Mata pelajaran wajib dipilih')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const periodEnd = editing.period + form.period_span - 1

      // Kalau ada entry lama, hapus dulu
      if (editing.entry) {
        await axios.delete(
          `${API_URL}/api/school-admin/timetables/${timetableId}/entries/${editing.entry.id}`,
          { headers }
        )
      }

      // Cek bentrok dengan entry lain di slot yang akan ditimpa
      for (let p = editing.period; p <= periodEnd; p++) {
        const occupied = grid[`${editing.day}-${p}`]
        if (occupied && occupied.id !== editing.entry?.id) {
          setSaveError(
            `Slot hari ${DAYS.find((d) => d.id === editing.day)?.label} jam ${p} sudah terisi. Kosongkan dulu.`
          )
          setSaving(false)
          return
        }
      }

      await axios.post(
        `${API_URL}/api/school-admin/timetables/${timetableId}/entries`,
        {
          timetable_id: timetableId,
          day_of_week: editing.day,
          period_start: editing.period,
          period_end: periodEnd,
          subject_id: form.subject_id,
          teacher_id: form.teacher_id,
          room: form.room,
          notes: form.notes,
        },
        { headers }
      )

      setEditing(null)
      await fetchData()
    } catch (err: any) {
      console.error('Gagal menyimpan:', err)
      setSaveError(err.response?.data?.error || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!editing?.entry) return
    if (!confirm('Hapus baris jadwal ini?')) return

    setSaving(true)
    setSaveError(null)
    try {
      const token = await getToken()
      await axios.delete(
        `${API_URL}/api/school-admin/timetables/${timetableId}/entries/${editing.entry.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEditing(null)
      await fetchData()
    } catch (err: any) {
      console.error('Gagal menghapus:', err)
      setSaveError(err.response?.data?.error || 'Gagal menghapus')
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    setConflicts(null)
    try {
      const token = await getToken()
      const res = await axios.post(
        `${API_URL}/api/school-admin/timetables/${timetableId}/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setConflicts(res.data.conflicts || [])
    } catch (err: any) {
      console.error('Gagal validasi:', err)
      alert(err.response?.data?.error || 'Gagal validasi')
    } finally {
      setValidating(false)
    }
  }

  const getPeriodLabel = (period: number) => {
    const slot = timeSlots.find((s) => s.period_number === period)
    if (slot) {
      return `${slot.start_time} - ${slot.end_time}`
    }
    return `Jam ${period}` 
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-tp-green" size={32} />
      </div>
    )
  }

  if (error || !header) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle size={32} className="text-rose-600" />
        <p className="text-sm font-medium text-rose-700">{error || 'Jadwal tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/school-admin/dashboard/timetables')}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Kembali
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/timetables')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-tp-border bg-white text-tp-muted hover:bg-tp-bg"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-tp-text sm:text-xl">Editor Jadwal</h1>
            <p className="text-xs text-tp-muted">
              Semester {header.semester} · Status: {header.status}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating}
            className="inline-flex items-center gap-2 rounded-xl border border-tp-border bg-white px-3 py-2 text-xs font-semibold text-tp-text hover:bg-tp-bg disabled:opacity-60"
          >
            {validating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Cek Bentrok
          </button>
        </div>
      </div>

      {/* Validation result */}
      {conflicts !== null && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            conflicts.length === 0
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {conflicts.length === 0 ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Tidak ada bentrok guru. Jadwal valid.</span>
            </div>
          ) : (
            <div>
              <p className="mb-2 flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                {conflicts.length} bentrok ditemukan:
              </p>
              <ul className="ml-6 list-disc space-y-1 text-xs">
                {conflicts.map((c, i) => (
                  <li key={i}>
                    Hari {DAYS.find((d) => d.id === c.day)?.label} jam {c.period} — {c.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead>
              <tr className="bg-tp-bg/60">
                <th className="w-24 border-b border-r border-tp-border px-2 py-2 text-left font-semibold text-tp-muted">
                  Jam
                </th>
                {DAYS.map((d) => (
                  <th
                    key={d.id}
                    className="border-b border-r border-tp-border px-2 py-2 text-center font-semibold text-tp-text last:border-r-0"
                  >
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="border-b border-r border-tp-border bg-tp-bg/30 px-2 py-1.5 text-center text-[11px] font-semibold text-tp-muted">
                    {getPeriodLabel(p)}
                  </td>
                  {DAYS.map((d) => {
                    const entry = grid[`${d.id}-${p}`]
                    const isStart = entry && entry.period_start === p
                    const isSpan = entry && entry.period_end > entry.period_start

                    // Kalau ini bukan start dari span, tapi bagian dari span lain, kosongkan (rowspan handle)
                    if (entry && !isStart) return null

                    return (
                      <td
                        key={`${d.id}-${p}`}
                        rowSpan={isSpan ? entry.period_end - entry.period_start + 1 : 1}
                        className="border-b border-r border-tp-border p-1 align-top last:border-r-0"
                      >
                        <button
                          type="button"
                          onClick={() => openEditCell(d.id, p)}
                          className={`flex h-full min-h-[52px] w-full flex-col items-start gap-0.5 rounded-lg p-1.5 text-left transition ${
                            entry
                              ? 'bg-tp-green/10 hover:bg-tp-green/15'
                              : 'hover:bg-tp-green/5'
                          }`}
                        >
                          {entry ? (
                            <>
                              <span className="text-[11px] font-semibold text-tp-green">
                                {entry.subject_name_snapshot || 'Mapel'}
                              </span>
                              {entry.teacher_name && (
                                <span className="text-[10px] text-tp-muted line-clamp-1">
                                  {entry.teacher_name}
                                </span>
                              )}
                              {entry.room && (
                                <span className="flex items-center gap-0.5 text-[10px] text-tp-faint">
                                  <MapPin size={9} />
                                  {entry.room}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-tp-faint">+ Tambah</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL EDIT CELL ===================== */}
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !saving && setEditing(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => !saving && setEditing(null)}
              className="absolute right-4 top-4 text-tp-muted hover:text-tp-text"
            >
              <X size={20} />
            </button>

            <h3 className="mb-1 text-base font-bold text-tp-text">
              {editing.entry ? 'Edit Jadwal' : 'Tambah Jadwal'}
            </h3>
            <p className="mb-4 text-xs text-tp-muted">
              {DAYS.find((d) => d.id === editing.day)?.label}, Jam {editing.period}
            </p>

            {saveError && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-tp-text">
                  <BookOpen size={12} /> Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2 text-sm outline-none focus:border-tp-green"
                >
                  <option value="">— Pilih Mapel —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-tp-text">
                  <UserCog size={12} /> Guru (opsional)
                </label>
                <select
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2 text-sm outline-none focus:border-tp-green"
                >
                  <option value="">— Pilih Guru —</option>
                  {teachers.map((t) => (
                    <option key={t.teacher_id} value={t.teacher_id}>
                      {t.nama_guru}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-tp-text">
                  <MapPin size={12} /> Ruang (opsional)
                </label>
                <input
                  type="text"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="mis. Lab IPA, Ruang 6A"
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2 text-sm outline-none focus:border-tp-green"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Durasi (JP)
                </label>
                <select
                  value={form.period_span}
                  onChange={(e) =>
                    setForm({ ...form, period_span: parseInt(e.target.value, 10) })
                  }
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2 text-sm outline-none focus:border-tp-green"
                >
                  <option value={1}>1 JP</option>
                  <option value={2}>2 JP (blok)</option>
                  <option value={3}>3 JP (blok)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-tp-border bg-white px-3 py-2 text-sm outline-none focus:border-tp-green"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {editing.entry && (
                <button
                  type="button"
                  onClick={handleDeleteEntry}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="flex-1 rounded-xl border border-tp-border bg-white px-3 py-2 text-xs font-semibold text-tp-text hover:bg-tp-bg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCell}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-tp-green px-3 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}