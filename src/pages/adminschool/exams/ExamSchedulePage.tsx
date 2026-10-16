import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Calendar, MapPin, User, Users,
  MoreVertical, Edit3, PlayCircle, Eye, BarChart3,
  AlertCircle, AlertTriangle, XCircle, Loader2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

type ExamSchedule = {
  id: string
  exam_id: string
  exam_title: string
  subject: string
  duration_minutes: number
  schedule_date: string
  start_time: string
  end_time: string
  room: string | null
  supervisor_name: string | null
  access_code: string | null
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  class_group_name: string | null
  class_sub_group_name: string | null
  total_students: number
  total_submitted: number
  total_graded: number
  average_score: number | null
  highest_score: number | null
  lowest_score: number | null
}

type DateFilter = 'all' | 'today' | 'week' | 'upcoming' | 'past'

const STATUS_STYLE: Record<
  ExamSchedule['status'],
  { label: string; bg: string; text: string; dot: string }
> = {
  scheduled: {
    label: 'Terjadwal',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  ongoing: {
    label: 'Berlangsung',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500 animate-pulse',
  },
  completed: {
    label: 'Selesai',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  cancelled: {
    label: 'Dibatalkan',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
}


export default function ExamSchedulePage() {
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL

  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('upcoming')
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ExamSchedule | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const params: Record<string, string> = {}
      if (dateFilter !== 'all') params.filter = dateFilter
      if (search.trim()) params.search = search.trim()

      const res = await axios.get<{ schedules: ExamSchedule[] }>(
        `${API_URL}/api/school-admin/exam-schedules`,
        {
          params,
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      )
      setSchedules(res.data.schedules || [])
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError((e.response?.data as { error?: string })?.error || e.message)
      } else if (e instanceof Error) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [API_URL, dateFilter, search])

  useEffect(() => {
    const t = setTimeout(fetchSchedules, 300)
    return () => clearTimeout(t)
  }, [fetchSchedules])

  useEffect(() => {
    const handler = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [openMenuId])

  const handleCancel = async () => {
    if (!cancelTarget) return

    setCancelling(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.patch(
        `${API_URL}/api/school-admin/exam-schedules/${cancelTarget.id}/cancel`,
        { reason: cancelReason.trim() || 'Dibatalkan oleh admin' },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )

      setCancelTarget(null)
      setCancelReason('')
      await fetchSchedules()
    } catch (e: unknown) {
      let errMsg = 'Gagal membatalkan jadwal'
      if (axios.isAxiosError(e)) {
        errMsg = (e.response?.data as { error?: string })?.error || e.message
      } else if (e instanceof Error) {
        errMsg = e.message
      }
      alert(errMsg)
    } finally {
      setCancelling(false)
    }
  }

  const stats = {
    all: schedules.length,
    today: schedules.filter((s) => isToday(s.schedule_date)).length,
    ongoing: schedules.filter((s) => s.status === 'ongoing').length,
    scheduled: schedules.filter((s) => s.status === 'scheduled').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-tp-text">Jadwal Ujian</h1>
          <p className="text-xs text-tp-muted">
            Kelola pelaksanaan ujian untuk siswa
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/school-admin/dashboard/exam-schedules/create')}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-tp-green-hover"
        >
          <Plus size={16} /> Buat Jadwal
        </button>
      </div>

      <div className="rounded-2xl border border-tp-border bg-white p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'today', label: 'Hari Ini' },
              { key: 'week', label: 'Minggu Ini' },
              { key: 'upcoming', label: 'Akan Datang' },
              { key: 'past', label: 'Selesai' },
              { key: 'all', label: 'Semua' },
            ] as const
          ).map(({ key, label }) => {
            const active = dateFilter === key
            const count =
              key === 'today'
                ? stats.today
                : key === 'all'
                ? stats.all
                : null
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDateFilter(key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-tp-green text-white'
                    : 'text-tp-muted hover:bg-slate-100'
                }`}
              >
                {label}
                {count !== null && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      active
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-tp-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tp-muted"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ujian, ruang, atau pengawas..."
          className="w-full rounded-xl border border-tp-border bg-white pl-10 pr-4 py-2.5 text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-tp-border bg-white"
            />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tp-border bg-white p-12 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50">
            <Calendar size={24} className="text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-bold text-tp-text">
            Belum ada jadwal ujian
          </p>
          <p className="mb-5 text-xs text-tp-muted">
            Buat jadwal dari soal ujian yang sudah dipublish, atau buat soal dadakan.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate('/school-admin/dashboard/exam-schedules/create')
            }
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover"
          >
            <Plus size={16} /> Buat Jadwal Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onMonitor={() =>
                navigate(`/school-admin/dashboard/exam-schedules/${s.id}/monitor`)
              }
              onDetail={() =>
                navigate(`/school-admin/dashboard/exam-schedules/${s.id}`)
              }
              onEdit={() =>
                navigate(`/school-admin/dashboard/exam-schedules/${s.id}/edit`)
              }
              onGrades={() =>
                navigate(`/school-admin/dashboard/exam-schedules/${s.id}/grades`)
              }
              onCancel={() => setCancelTarget(s)}
            />
          ))}
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !cancelling && setCancelTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tp-text">
                  Batalkan Jadwal?
                </h3>
                <p className="text-xs text-tp-muted">
                  Jadwal ini akan dibatalkan dan tidak bisa diaktifkan kembali.
                </p>
              </div>
            </div>

            {/* Info jadwal */}
            <div className="mb-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-tp-muted">
                <b className="text-tp-text">{cancelTarget.exam_title}</b>
                <br />
                {cancelTarget.subject} •{' '}
                {cancelTarget.class_sub_group_name || 'Semua kelas'}
                <br />
                {formatFullDate(cancelTarget.schedule_date)} •{' '}
                {cancelTarget.start_time?.slice(0, 5)} -{' '}
                {cancelTarget.end_time?.slice(0, 5)}
              </p>
            </div>

            {/* Warning */}
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] text-amber-800">
                <b>Hanya bisa dibatalkan</b> kalau belum ada siswa yang
                mengerjakan. Kalau sudah berjalan, gunakan <b>Tutup Sesi</b> di
                halaman Monitor.
              </p>
            </div>

            {/* Reason */}
            <label className="mb-1.5 block text-xs font-semibold text-tp-text">
              Alasan pembatalan (opsional)
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Contoh: Ujian diundur karena libur nasional"
              className="w-full resize-none rounded-xl border border-tp-border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
              autoFocus
            />

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => {
                  setCancelTarget(null)
                  setCancelReason('')
                }}
                className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <Loader2 size={12} className="mr-1 inline animate-spin" />
                    Membatalkan...
                  </>
                ) : (
                  'Ya, Batalkan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScheduleCard({
  schedule,
  openMenuId,
  setOpenMenuId,
  onMonitor,
  onDetail,
  onEdit,
  onGrades,
  onCancel,
}: {
  schedule: ExamSchedule
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  onMonitor: () => void
  onDetail: () => void
  onEdit: () => void
  onGrades: () => void
  onCancel: () => void
}) {
  const cfg = STATUS_STYLE[schedule.status]
  const isTodayDate = isToday(schedule.schedule_date)
  const progress =
    schedule.total_students > 0
      ? Math.round((schedule.total_submitted / schedule.total_students) * 100)
      : 0

  const canCancel =
    schedule.status === 'scheduled' &&
    schedule.total_submitted === 0

  return (
    <div className="rounded-2xl border border-tp-border bg-white p-5 transition hover:border-tp-green/40">
      <div className="flex flex-wrap items-start gap-4">
        {/* Time column */}
        <div className="w-24 shrink-0">
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-tp-muted">
              {formatDay(schedule.schedule_date)}
            </div>
            <div className="text-lg font-bold text-tp-text">
              {formatDate(schedule.schedule_date)}
            </div>
            <div className="text-[10px] text-tp-muted">
              {formatMonth(schedule.schedule_date)}
            </div>
          </div>
          <div className="mt-2 text-center">
            <div className="text-[11px] font-bold text-tp-text">
              {schedule.start_time?.slice(0, 5)}
            </div>
            <div className="text-[10px] text-tp-muted">
              s/d {schedule.end_time?.slice(0, 5)}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-tp-text">
              {schedule.exam_title}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.bg} ${cfg.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {isTodayDate &&
              schedule.status !== 'completed' &&
              schedule.status !== 'cancelled' && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  HARI INI
                </span>
              )}
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-tp-green/10 px-2 py-0.5 text-[10px] font-semibold text-tp-green">
              {schedule.subject}
            </span>
            <span className="text-[11px] text-tp-muted">•</span>
            <span className="text-[11px] text-tp-muted">
              {schedule.duration_minutes} menit
            </span>
            {schedule.class_sub_group_name && (
              <>
                <span className="text-[11px] text-tp-muted">•</span>
                <span className="text-[11px] font-semibold text-tp-text">
                  {schedule.class_sub_group_name}
                </span>
              </>
            )}
          </div>

          {/* Info grid */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-tp-muted">
            {schedule.room && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {schedule.room}
              </span>
            )}
            {schedule.supervisor_name && (
              <span className="inline-flex items-center gap-1">
                <User size={12} /> {schedule.supervisor_name}
              </span>
            )}
            {schedule.access_code && (
              <span className="inline-flex items-center gap-1 font-mono">
                <span className="text-tp-faint">Kode:</span>
                <b className="text-tp-text">{schedule.access_code}</b>
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-tp-green transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-tp-muted">
              {schedule.total_submitted}/{schedule.total_students} ({progress}%)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-tp-muted">
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> {schedule.total_students} siswa
            </span>
            {schedule.average_score !== null && (
              <span className="inline-flex items-center gap-1">
                <BarChart3 size={12} />
                Rata-rata:{' '}
                <b className="text-tp-text">
                  {schedule.average_score.toFixed(1)}
                </b>
              </span>
            )}
            {schedule.highest_score !== null &&
              schedule.lowest_score !== null && (
                <span className="text-tp-muted">
                  Tertinggi:{' '}
                  <b className="text-emerald-600">
                    {schedule.highest_score}
                  </b>
                  {' • '}
                  Terendah:{' '}
                  <b className="text-rose-600">{schedule.lowest_score}</b>
                </span>
              )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {schedule.status === 'ongoing' && (
            <button
              type="button"
              onClick={onMonitor}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
            >
              <PlayCircle size={13} /> Monitor
            </button>
          )}
          {schedule.status === 'completed' && (
            <button
              type="button"
              onClick={onGrades}
              className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3 py-2 text-xs font-semibold text-tp-text hover:bg-slate-50"
            >
              <BarChart3 size={13} /> Nilai
            </button>
          )}
          {schedule.status === 'scheduled' && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3 py-2 text-xs font-semibold text-tp-text hover:bg-slate-50"
            >
              <Edit3 size={13} /> Edit
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(
                  openMenuId === schedule.id ? null : schedule.id
                )
              }}
              className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
            >
              <MoreVertical size={14} />
            </button>

            {openMenuId === schedule.id && (
              <div
                className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-tp-border bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <MenuItem
                  icon={<Eye size={14} />}
                  label="Lihat Detail"
                  onClick={() => {
                    setOpenMenuId(null)
                    onDetail()
                  }}
                />
                <MenuItem
                  icon={<BarChart3 size={14} />}
                  label="Lihat Nilai"
                  onClick={() => {
                    setOpenMenuId(null)
                    onGrades()
                  }}
                />
                {schedule.status === 'scheduled' && (
                  <MenuItem
                    icon={<Edit3 size={14} />}
                    label="Edit Jadwal"
                    onClick={() => {
                      setOpenMenuId(null)
                      onEdit()
                    }}
                  />
                )}

                {/* Cancel — hanya tampil kalau bisa dibatalkan */}
                {canCancel && (
                  <>
                    <div className="border-t border-tp-border" />
                    <MenuItem
                      icon={<XCircle size={14} />}
                      label="Batalkan"
                      tone="rose"
                      onClick={() => {
                        setOpenMenuId(null)
                        onCancel()
                      }}
                    />
                  </>
                )}

                {/* Info kalau tidak bisa dibatalkan */}
                {schedule.status === 'ongoing' && (
                  <>
                    <div className="border-t border-tp-border" />
                    <div className="px-3.5 py-2.5 text-[10px] text-tp-faint">
                      ⚠️ Ujian sudah berlangsung.
                      <br />
                      Gunakan <b>Tutup Sesi</b> di Monitor.
                    </div>
                  </>
                )}
                {schedule.status === 'scheduled' &&
                  schedule.total_submitted > 0 && (
                    <>
                      <div className="border-t border-tp-border" />
                      <div className="px-3.5 py-2.5 text-[10px] text-tp-faint">
                        ⚠️ Sudah ada siswa submit.
                        <br />
                        Gunakan <b>Tutup Sesi</b> di Monitor.
                      </div>
                    </>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'rose'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium transition ${
        tone === 'rose'
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-tp-text hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function isToday(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10)
  return dateStr === today
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { weekday: 'short' })
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric' })
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}