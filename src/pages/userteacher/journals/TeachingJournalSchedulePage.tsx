import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, BookOpen, Users, AlertTriangle, CheckCircle2, FileEdit } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL

type Slot = {
  timetable_entry_id: string
  subject_id: string
  subject_name: string
  class_name: string
  period_start: number
  period_end: number
  start_time: string
  end_time: string
  room: string
  journal_id: string
  students: string
  journal_status: '' | 'draft' | 'submitted' | 'verified' | 'rejected'
}

function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

export default function TeachingJournalSchedulePage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayJakarta())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [isHoliday, setIsHoliday] = useState(false)
  const [holidayName, setHolidayName] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Sesi berakhir, silakan login ulang')

      const res = await axios.get(`${API_URL}/api/teacher/journals/schedule`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
      })
      setSlots(res.data.slots || [])
      setIsHoliday(!!res.data.is_holiday)
      setHolidayName(res.data.holiday_name || '')
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Gagal memuat jadwal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [date])

  const badge = (status: Slot['journal_status']) => {
    if (!status) return { label: 'Belum diisi', cls: 'bg-slate-100 text-slate-600', icon: <AlertTriangle size={12} /> }
    if (status === 'draft') return { label: 'Draft', cls: 'bg-amber-100 text-amber-700', icon: <FileEdit size={12} /> }
    if (status === 'submitted') return { label: 'Terkumpul', cls: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 size={12} /> }
    if (status === 'verified') return { label: 'Terverifikasi', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={12} /> }
    return { label: 'Ditolak', cls: 'bg-rose-100 text-rose-700', icon: <AlertTriangle size={12} /> }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tp-text">Jurnal Mengajar</h1>
          <p className="text-sm text-tp-muted">Pilih tanggal untuk melihat jadwal dan mengisi jurnal.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-tp-muted" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-tp-border bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {isHoliday && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Hari libur:</strong> {holidayName || 'Sekolah tidak melaksanakan KBM'} — jurnal tidak dapat diisi pada tanggal ini.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-tp-border bg-white p-8 text-center text-sm text-tp-muted">
          Memuat jadwal...
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border border-tp-border bg-white p-8 text-center text-sm text-tp-muted">
          Tidak ada jadwal mengajar pada tanggal ini.
        </div>
      ) : (
        <div className="grid gap-3">
          {slots.map((s) => {
            const b = badge(s.journal_status)
            return (
              <div key={s.timetable_entry_id} className="flex flex-col gap-3 rounded-xl border border-tp-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      <Clock size={12} /> {s.start_time}–{s.end_time}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      <BookOpen size={12} /> {s.subject_name || 'Mata Pelajaran'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                      <Users size={12} /> {s.class_name}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${b.cls}`}>
                      {b.icon} {b.label}
                    </span>
                  </div>
                  <div className="text-xs text-tp-faint">Periode {s.period_start}–{s.period_end}{s.room && ` • Ruang ${s.room}`}</div>
                </div>
                <div className="flex gap-2">
                  {s.journal_id ? (
                    <button
                      onClick={() => navigate(`/journals/${s.journal_id}`)}
                      className="rounded-xl border border-tp-border px-4 py-2 text-sm font-semibold text-tp-text hover:bg-slate-50"
                    >
                      Lihat Jurnal
                    </button>
                  ) : (
                    <button
                      disabled={isHoliday}
                      onClick={() => navigate(`/journals/new?entry=${s.timetable_entry_id}&date=${date}`, { 
                        state: { students: s.students, meta: s } // <-- KIRIM DATA SISWA LEWAT STATE
                      })}
                      className="rounded-xl bg-tp-green px-4 py-2 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-40"
                    >
                      Isi Jurnal
                  </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}