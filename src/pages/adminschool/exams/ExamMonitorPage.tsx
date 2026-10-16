import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Search, RefreshCw, Clock, Users, CheckCircle2,
  AlertTriangle, XCircle, Loader2, Circle, Flag, Eye,
  Filter, Download, Lock, MapPin, User as UserIcon, KeyRound,
  TrendingUp, AlertCircle, Wifi, Unlock, Megaphone,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { broadcastExamControl } from '../../../lib/examControlChannel'

type SubmissionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'graded_with_pending'

type StudentRow = {
  student_id: string
  student_name: string
  nisn: string
  student_number: string
  class_sub_group_name: string
  submission_id: string | null
  status: SubmissionStatus
  started_at: string | null
  submitted_at: string | null
  last_activity_at: string | null
  time_spent_seconds: number | null
  total_score: number | null
  percentage: number | null
  is_passed: boolean | null
  is_flagged: boolean
  tab_switch_count: number
  ip_address: string | null
  session_id: string | null
  session_token: string | null
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
}

type ScheduleInfo = {
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
}

type MonitorResponse = {
  schedule: ScheduleInfo
  students: StudentRow[]
  stats: {
    total_students: number
    in_progress: number
    submitted: number
    graded: number
    not_started: number
    flagged: number
    blocked: number
    average_score: number | null
  }
}


const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; bg: string; text: string; dot: string; icon: typeof Circle }
> = {
  not_started: {
    label: 'Belum Mulai',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    icon: Circle,
  },
  in_progress: {
    label: 'Mengerjakan',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500 animate-pulse',
    icon: Clock,
  },
  submitted: {
    label: 'Selesai',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  graded: {
    label: 'Sudah Dinilai',
    bg: 'bg-tp-green/10',
    text: 'text-tp-green',
    dot: 'bg-tp-green',
    icon: CheckCircle2,
  },
  graded_with_pending: {
    label: 'Nilai Parsial',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
  },
}

type StatusFilter =
  | 'all'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'not_started'
  | 'flagged'
  | 'blocked'


export default function ExamMonitorPage() {
  const navigate = useNavigate()
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const API_URL = import.meta.env.VITE_API_URL

  const [data, setData] = useState<MonitorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval] = useState(10) 
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(refreshInterval)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closing, setClosing] = useState(false)

  const [blockTarget, setBlockTarget] = useState<StudentRow | null>(null)
  const [warnTarget, setWarnTarget] = useState<StudentRow | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [warnMessage, setWarnMessage] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const timerRef = useRef<number | null>(null)

  const fetchData = useCallback(
    async (silent = false) => {
      if (!scheduleId) return
      if (!silent) setLoading(true)
      setRefreshing(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await axios.get<MonitorResponse>(
          `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/monitor`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        )
        setData(res.data)
        setLastRefreshed(new Date())
        setSecondsUntilRefresh(refreshInterval)
      } catch (e: unknown) {
        setError(getErrorMessage(e))
      } finally {
        if (!silent) setLoading(false)
        setRefreshing(false)
      }
    },
    [API_URL, scheduleId, refreshInterval]
  )

  useEffect(() => {
    fetchData(false)
  }, [scheduleId]) 

  useEffect(() => {
    if (!autoRefresh) return
    if (timerRef.current) window.clearInterval(timerRef.current)

    timerRef.current = window.setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchData(true)
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [autoRefresh, refreshInterval, fetchData])

  const handleClose = async () => {
    if (!scheduleId) return
    setClosing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.patch(
        `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/close`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setConfirmClose(false)
      await fetchData(true)
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setClosing(false)
    }
  }

  const handleBlock = async () => {
    if (!blockTarget || !blockReason.trim()) return
    if (!blockTarget.session_id) {
      alert('Session siswa tidak ditemukan. Siswa mungkin belum mulai mengerjakan.')
      return
    }

    setActionLoading(blockTarget.student_id)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.post(
        `${API_URL}/api/school-admin/exam-live-sessions/${blockTarget.session_id}/block`,
        { reason: blockReason.trim() },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )

      if (data && blockTarget.session_token) {
        try {
          await broadcastExamControl(data.schedule.id, {
            type: 'block',
            student_id: blockTarget.student_id,
            session_token: blockTarget.session_token,
            reason: blockReason.trim(),
          })
        } catch (bcErr) {
          console.warn('[Monitor] broadcast block failed:', bcErr)
        }
      }

      setBlockTarget(null)
      setBlockReason('')
      await fetchData(true)
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblock = async (s: StudentRow) => {
    if (!s.session_id) return
    if (!confirm(`Aktifkan kembali ${s.student_name}?`)) return

    setActionLoading(s.student_id)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.post(
        `${API_URL}/api/school-admin/exam-live-sessions/${s.session_id}/unblock`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )

      if (data && s.session_token) {
        try {
          await broadcastExamControl(data.schedule.id, {
            type: 'unblock',
            student_id: s.student_id,
            session_token: s.session_token,
          })
        } catch (bcErr) {
          console.warn('[Monitor] broadcast unblock failed:', bcErr)
        }
      }

      await fetchData(true)
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  const handleWarn = async () => {
    if (!warnTarget || !warnMessage.trim()) return
    if (!warnTarget.session_id) {
      alert('Session siswa tidak ditemukan.')
      return
    }

    setActionLoading(warnTarget.student_id)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.post(
        `${API_URL}/api/school-admin/exam-live-sessions/${warnTarget.session_id}/warn`,
        { message: warnMessage.trim() },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )

      if (data && warnTarget.session_token) {
        try {
          await broadcastExamControl(data.schedule.id, {
            type: 'warning',
            student_id: warnTarget.student_id,
            session_token: warnTarget.session_token,
            message: warnMessage.trim(),
          })
        } catch (bcErr) {
          console.warn('[Monitor] broadcast warning failed:', bcErr)
        }
      }

      setWarnTarget(null)
      setWarnMessage('')
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportCSV = () => {
    if (!data) return
    const headers = [
      'No', 'Nama', 'NISN', 'Nomor Induk', 'Sub Kelas',
      'Status', 'Mulai', 'Submit', 'Durasi (menit)',
      'Skor', 'Persentase', 'Lulus', 'Flagged', 'Tab Switch',
      'Diblokir', 'Alasan Blokir',
    ]
    const rows = data.students.map((s, i) => [
      i + 1,
      s.student_name,
      s.nisn,
      s.student_number,
      s.class_sub_group_name,
      STATUS_CONFIG[s.status].label,
      s.started_at ? formatDateTime(s.started_at) : '-',
      s.submitted_at ? formatDateTime(s.submitted_at) : '-',
      s.time_spent_seconds ? Math.round(s.time_spent_seconds / 60) : '-',
      s.total_score ?? '-',
      s.percentage != null ? `${s.percentage.toFixed(1)}%` : '-',
      s.is_passed == null ? '-' : s.is_passed ? 'Ya' : 'Tidak',
      s.is_flagged ? 'Ya' : 'Tidak',
      s.tab_switch_count,
      s.is_blocked ? 'Ya' : 'Tidak',
      s.blocked_reason || '-',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitor_${data.schedule.exam_title.replace(
      /[^a-z0-9]/gi,
      '_'
    )}_${data.schedule.schedule_date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredStudents = useMemo(() => {
    if (!data) return []
    let list = data.students

    if (statusFilter !== 'all') {
      if (statusFilter === 'flagged') {
        list = list.filter((s) => s.is_flagged)
      } else if (statusFilter === 'blocked') {
        list = list.filter((s) => s.is_blocked)
      } else if (statusFilter === 'graded') {
        list = list.filter(
          (s) => s.status === 'graded' || s.status === 'graded_with_pending'
        )
      } else {
        list = list.filter((s) => s.status === statusFilter)
      }
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          s.nisn.toLowerCase().includes(q) ||
          s.student_number.toLowerCase().includes(q)
      )
    }

    return list
  }, [data, statusFilter, search])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/exam-schedules')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-tp-text">Memuat monitor...</h1>
        </div>
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-tp-border bg-white">
          <Loader2 size={24} className="animate-spin text-tp-green" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/exam-schedules')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-tp-text">Gagal Memuat</h1>
        </div>
        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error || 'Data monitor tidak ditemukan'}
        </div>
      </div>
    )
  }

  const { schedule, stats } = data
  const remainingTime = getRemainingTime(schedule)
  const isLive = schedule.status === 'ongoing'

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/school-admin/dashboard/exam-schedules')}
          className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-tp-text">
            Monitor Ujian
          </h1>
          <p className="truncate text-[11px] text-tp-muted">
            {schedule.exam_title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              autoRefresh
                ? 'border-tp-green bg-tp-green/10 text-tp-green'
                : 'border-tp-border bg-white text-tp-muted hover:bg-slate-50'
            }`}
          >
            <Wifi size={12} className={autoRefresh ? 'animate-pulse' : ''} />
            {autoRefresh ? `Auto (${secondsUntilRefresh}s)` : 'Auto: Off'}
          </button>
          <button
            type="button"
            onClick={() => fetchData(false)}
            disabled={refreshing}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
            {schedule.status === 'completed' && (
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
                Selesai
              </span>
            )}
            {schedule.status === 'scheduled' && (
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">
                Belum Dimulai
              </span>
            )}
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-tp-muted">
              {schedule.subject}
            </span>
          </div>

          <h2 className="mb-2 text-xl font-bold text-tp-text">
            {schedule.exam_title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-tp-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} />
              {formatDate(schedule.schedule_date)} • {formatTime24(schedule.start_time)} - {formatTime24(schedule.end_time)}
            </span>
            {schedule.room && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} /> {schedule.room}
              </span>
            )}
            {schedule.supervisor_name && (
              <span className="inline-flex items-center gap-1.5">
                <UserIcon size={12} /> {schedule.supervisor_name}
              </span>
            )}
            {schedule.access_code && (
              <span className="inline-flex items-center gap-1.5 font-mono">
                <KeyRound size={12} />
                <b className="text-tp-text">{schedule.access_code}</b>
              </span>
            )}
            {schedule.class_sub_group_name && (
              <span className="rounded-md bg-tp-green/10 px-2 py-0.5 text-[10px] font-semibold text-tp-green">
                {schedule.class_sub_group_name}
              </span>
            )}
          </div>
        </div>

        {isLive && remainingTime && (
          <div className="border-t border-tp-border bg-emerald-50/50 px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">
                ⏱ Sisa waktu ujian
              </span>
              <span className="font-mono text-lg font-bold text-emerald-700">
                {remainingTime}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Peserta"
          value={stats.total_students}
          icon={<Users size={16} className="text-slate-600" />}
          tone="slate"
        />
        <StatCard
          label="Mengerjakan"
          value={stats.in_progress}
          icon={<Clock size={16} className="text-blue-600" />}
          tone="blue"
          pulse={stats.in_progress > 0}
        />
        <StatCard
          label="Selesai"
          value={stats.submitted + stats.graded}
          icon={<CheckCircle2 size={16} className="text-emerald-600" />}
          tone="emerald"
        />
        <StatCard
          label="Belum Mulai"
          value={stats.not_started}
          icon={<XCircle size={16} className="text-slate-500" />}
          tone="slate"
        />
        <StatCard
          label="Diblokir"
          value={stats.blocked}
          icon={<Lock size={16} className="text-rose-600" />}
          tone="rose"
          highlight={stats.blocked > 0}
        />
        <StatCard
          label="Rata-rata"
          value={stats.average_score != null ? stats.average_score.toFixed(1) : '—'}
          icon={<TrendingUp size={16} className="text-amber-600" />}
          tone="amber"
        />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-tp-border bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NISN, atau nomor induk..."
              className="w-full rounded-lg border border-tp-border pl-9 pr-3 py-2 text-xs focus:border-tp-green focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { key: 'all', label: 'Semua', count: stats.total_students },
                {
                  key: 'in_progress',
                  label: 'Mengerjakan',
                  count: stats.in_progress,
                },
                {
                  key: 'submitted',
                  label: 'Selesai',
                  count: stats.submitted + stats.graded,
                },
                { key: 'not_started', label: 'Belum', count: stats.not_started },
                { key: 'flagged', label: 'Flagged', count: stats.flagged },
                { key: 'blocked', label: 'Diblokir', count: stats.blocked },
              ] as const
            ).map(({ key, label, count }) => {
              const active = statusFilter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                    active
                      ? 'bg-tp-green text-white'
                      : 'bg-slate-100 text-tp-muted hover:bg-slate-200'
                  }`}
                >
                  {label}
                  <span
                    className={`rounded px-1.5 text-[10px] ${
                      active ? 'bg-white/25' : 'bg-white'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <span className="text-[10px] text-tp-faint">
            {lastRefreshed &&
              `Terakhir update: ${lastRefreshed.toLocaleTimeString('id-ID')}`}
          </span>
          <span className="text-[10px] text-tp-faint">
            Menampilkan {filteredStudents.length} dari {data.students.length} siswa
          </span>
        </div>
      </div>

      {/* Students table */}
      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50">
              <Filter size={22} className="text-slate-400" />
            </div>
            <p className="mb-1 text-sm font-bold text-tp-text">
              Tidak ada siswa yang cocok
            </p>
            <p className="text-xs text-tp-muted">
              Coba ubah filter atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-tp-border bg-slate-50/60">
                <tr>
                  <Th>Nama Siswa</Th>
                  <Th>NISN</Th>
                  <Th>Sub Kelas</Th>
                  <Th>Status</Th>
                  <Th>Durasi</Th>
                  <Th align="right">Skor</Th>
                  <Th align="center">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const cfg = STATUS_CONFIG[s.status]
                  const StatusIcon = cfg.icon
                  const isInProgress = s.status === 'in_progress'
                  const canControl = isInProgress && !!s.session_id

                  return (
                    <tr
                      key={s.student_id}
                      className={`border-b border-slate-100 last:border-0 ${
                        s.is_blocked
                          ? 'bg-rose-50/40 hover:bg-rose-50/60'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-tp-text">
                                {s.student_name}
                              </span>
                              {s.is_flagged && (
                                <span title="Flagged">
                                  <Flag size={11} className="text-rose-500" />
                                </span>
                              )}
                              {s.is_blocked && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-700"
                                  title={s.blocked_reason || 'Diblokir'}
                                >
                                  <Lock size={8} /> DIBLOKIR
                                </span>
                              )}
                            </div>
                            {s.tab_switch_count > 0 && (
                              <div className="text-[10px] text-rose-500">
                                ⚠ {s.tab_switch_count}× pindah tab
                              </div>
                            )}
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <code className="text-[11px] text-tp-muted">
                          {s.nisn || '—'}
                        </code>
                      </Td>
                      <Td>
                        <span className="text-[11px] text-tp-muted">
                          {s.class_sub_group_name || '—'}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}
                        >
                          <StatusIcon size={10} />
                          {cfg.label}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[11px] text-tp-muted">
                          {s.time_spent_seconds
                            ? `${Math.round(s.time_spent_seconds / 60)}m`
                            : s.started_at
                            ? '—'
                            : '—'}
                        </span>
                      </Td>
                      <Td align="right">
                        {s.total_score != null ? (
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-sm font-bold ${
                                s.is_passed
                                  ? 'text-emerald-600'
                                  : s.is_passed === false
                                  ? 'text-rose-600'
                                  : 'text-tp-text'
                              }`}
                            >
                              {s.total_score}
                            </span>
                            {s.percentage != null && (
                              <span className="text-[10px] text-tp-faint">
                                {s.percentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-tp-faint">—</span>
                        )}
                      </Td>
                      <Td align="center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Lihat jawaban (kalau sudah submit) */}
                          {s.submission_id && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/school-admin/dashboard/exam-schedules/${scheduleId}/submissions/${s.submission_id}`
                                )
                              }
                              className="inline-grid h-7 w-7 place-items-center rounded-lg text-tp-muted hover:bg-slate-100"
                              title="Lihat jawaban"
                            >
                              <Eye size={13} />
                            </button>
                          )}

                          {/* Kontrol: blokir / unblock / warning */}
                          {canControl && (
                            <>
                              {s.is_blocked ? (
                                <button
                                  type="button"
                                  disabled={actionLoading === s.student_id}
                                  onClick={() => handleUnblock(s)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                                  title="Aktifkan kembali"
                                >
                                  {actionLoading === s.student_id ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <Unlock size={10} />
                                  )}
                                  Aktifkan
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={actionLoading === s.student_id}
                                    onClick={() => setWarnTarget(s)}
                                    className="inline-grid h-7 w-7 place-items-center rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                                    title="Kirim peringatan"
                                  >
                                    <Megaphone size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionLoading === s.student_id}
                                    onClick={() => {
                                      setBlockReason('')
                                      setBlockTarget(s)
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                                    title="Blokir siswa"
                                  >
                                    <Lock size={10} /> Blokir
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {!canControl && !s.submission_id && (
                            <span className="text-[10px] text-tp-faint">—</span>
                          )}
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50"
        >
          <Download size={14} /> Ekspor CSV
        </button>

        {schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => setConfirmClose(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Lock size={14} /> Tutup Sesi Sekarang
          </button>
        )}
      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !closing && setConfirmClose(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100">
                <Lock size={18} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tp-text">Tutup Sesi?</h3>
                <p className="text-xs text-tp-muted">
                  Siswa yang masih mengerjakan tidak akan bisa submit lagi.
                </p>
              </div>
            </div>

            {stats.in_progress > 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800">⚠ Perhatian</p>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  Masih ada <b>{stats.in_progress} siswa</b> yang sedang
                  mengerjakan. Pastikan mereka sudah dikonfirmasi sebelum sesi
                  ditutup.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={closing}
                onClick={() => setConfirmClose(false)}
                className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={handleClose}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {closing ? 'Menutup...' : 'Ya, Tutup Sesi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {blockTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setBlockTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100">
                <Lock size={20} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tp-text">Blokir Siswa?</h3>
                <p className="text-xs text-tp-muted">
                  Siswa akan langsung terblokir di detik ini juga (realtime).
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-tp-muted">
                <b className="text-tp-text">{blockTarget.student_name}</b>
                <br />
                NISN: {blockTarget.nisn || '—'}
                {blockTarget.tab_switch_count > 0 && (
                  <span className="text-rose-600">
                    <br />
                    ⚠ {blockTarget.tab_switch_count}× pindah tab
                  </span>
                )}
              </p>
            </div>

            <label className="mb-1.5 block text-xs font-semibold text-tp-text">
              Alasan blokir <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Contoh: Terdeteksi melihat catatan"
              className="w-full resize-none rounded-xl border border-tp-border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
              autoFocus
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={!!actionLoading}
                onClick={() => {
                  setBlockTarget(null)
                  setBlockReason('')
                }}
                className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!blockReason.trim() || !!actionLoading}
                onClick={handleBlock}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading === blockTarget.student_id ? (
                  <>
                    <Loader2 size={12} className="mr-1 inline animate-spin" />
                    Memblokir...
                  </>
                ) : (
                  'Ya, Blokir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {warnTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setWarnTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100">
                <Megaphone size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tp-text">
                  Kirim Peringatan
                </h3>
                <p className="text-xs text-tp-muted">
                  Pesan akan muncul langsung di layar siswa (realtime).
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-tp-muted">
                Untuk: <b className="text-tp-text">{warnTarget.student_name}</b>
              </p>
            </div>

            <label className="mb-1.5 block text-xs font-semibold text-tp-text">
              Pesan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              placeholder="Contoh: Fokus ke layar, jangan melihat ke samping"
              className="w-full resize-none rounded-xl border border-tp-border px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              autoFocus
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-tp-muted">Template cepat:</span>
              {[
                'Fokus ke layar ujian',
                'Jangan melihat ke samping',
                'Jangan berbicara dengan teman',
                'Simpan alat komunikasi',
              ].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setWarnMessage(tpl)}
                  className="rounded-md border border-tp-border bg-white px-2 py-0.5 text-[10px] font-semibold text-tp-muted hover:bg-slate-50"
                >
                  {tpl}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={!!actionLoading}
                onClick={() => {
                  setWarnTarget(null)
                  setWarnMessage('')
                }}
                className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!warnMessage.trim() || !!actionLoading}
                onClick={handleWarn}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {actionLoading === warnTarget.student_id ? (
                  <>
                    <Loader2 size={12} className="mr-1 inline animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
  pulse,
  highlight,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  tone: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose'
  pulse?: boolean
  highlight?: boolean
}) {
  const tones: Record<typeof tone, string> = {
    slate: 'border-slate-200 bg-white',
    blue: 'border-blue-200 bg-blue-50/40',
    emerald: 'border-emerald-200 bg-emerald-50/40',
    amber: 'border-amber-200 bg-amber-50/40',
    rose: 'border-rose-200 bg-rose-50/40',
  }
  return (
    <div
      className={`rounded-2xl border p-4 ${tones[tone]} ${
        highlight ? 'ring-2 ring-rose-200' : ''
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
          {label}
        </span>
      </div>
      <div
        className={`text-2xl font-bold text-tp-text ${
          pulse ? 'animate-pulse' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-${align} text-[10px] font-bold uppercase tracking-wider text-tp-muted`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
}) {
  return <td className={`px-4 py-3 text-${align}`}>{children}</td>
}


function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (
      (e.response?.data as { error?: string } | undefined)?.error || e.message
    )
  }
  if (e instanceof Error) return e.message
  return String(e)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime24(t: string): string {
  return t?.slice(0, 5) || '-'
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRemainingTime(schedule: ScheduleInfo): string | null {
  if (schedule.status !== 'ongoing' && schedule.status !== 'scheduled')
    return null

  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const parts = schedule.end_time.split(':')
  const endH = parseInt(parts[0], 10)
  const endM = parseInt(parts[1], 10)
  const endS = parts[2] ? parseInt(parts[2], 10) : 0
  const endDate = new Date(y, m, d, endH, endM, endS)
  const now = new Date()

  let diffMs = endDate.getTime() - now.getTime()
  if (diffMs < 0) diffMs = 0

  const totalSec = Math.floor(diffMs / 1000)
  const hh = Math.floor(totalSec / 3600)
  const mm = Math.floor((totalSec % 3600) / 60)
  const ss = totalSec % 60

  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}