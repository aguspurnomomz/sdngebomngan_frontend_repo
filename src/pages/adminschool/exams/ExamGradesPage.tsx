import { useEffect, useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, AlertCircle, Loader2, CheckCircle2, XCircle,
  Clock, Users, Award, TrendingUp, Search, Download, Eye,
  Edit3, AlertTriangle, BarChart3, RefreshCw,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

type StudentGrade = {
  student_id: string
  student_name: string
  student_nisn: string
  student_number: string
  class_sub_group_name: string
  submission_id: string | null
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'graded_with_pending'
  total_score: number | null
  max_score: number | null
  percentage: number | null
  is_passed: boolean | null
  submitted_at: string | null
  time_spent_seconds: number | null
  tab_switch_count: number
  is_flagged: boolean
  pending_essay_count: number
}

type ScheduleInfo = {
  id: string
  exam_id: string
  exam_title: string
  subject: string
  schedule_date: string
  start_time: string
  end_time: string
  room: string | null
  supervisor_name: string | null
  passing_score: number
  total_students: number
}

type GradesResponse = {
  schedule: ScheduleInfo
  students: StudentGrade[]
  stats: {
    total: number
    submitted: number
    graded: number
    pending: number
    not_started: number
    passed: number
    failed: number
    average: number | null
    highest: number | null
    lowest: number | null
    flagged: number
  }
}

type FilterMode =
  | 'all'
  | 'graded'
  | 'pending'
  | 'passed'
  | 'failed'
  | 'not_started'
  | 'flagged'


const STATUS_STYLE: Record<
  StudentGrade['status'],
  { label: string; bg: string; text: string; icon: typeof Clock }
> = {
  not_started: {
    label: 'Belum Mulai',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    icon: Clock,
  },
  in_progress: {
    label: 'Mengerjakan',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: Clock,
  },
  submitted: {
    label: 'Selesai',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  graded: {
    label: 'Sudah Dinilai',
    bg: 'bg-tp-green/10',
    text: 'text-tp-green',
    icon: CheckCircle2,
  },
  graded_with_pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: AlertTriangle,
  },
}

export default function ExamGradesPage() {
  const navigate = useNavigate()
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const API_URL = import.meta.env.VITE_API_URL

  const [data, setData] = useState<GradesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sortBy, setSortBy] = useState<'name' | 'score_high' | 'score_low' | 'recent'>(
    'name'
  )

  const fetchData = useCallback(async () => {
    if (!scheduleId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.get<GradesResponse>(
        `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/grades`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setData(res.data)
    } catch (e: unknown) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [scheduleId, API_URL])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  
  const filteredStudents = useMemo(() => {
    if (!data) return []
    let list = [...data.students]

    if (filter !== 'all') {
      list = list.filter((s) => {
        if (filter === 'graded') return s.status === 'graded'
        if (filter === 'pending') return s.status === 'graded_with_pending'
        if (filter === 'passed') return s.is_passed === true
        if (filter === 'failed') return s.is_passed === false
        if (filter === 'not_started') return s.status === 'not_started'
        if (filter === 'flagged') return s.is_flagged
        return true
      })
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          s.student_nisn.toLowerCase().includes(q) ||
          s.student_number.toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.student_name.localeCompare(b.student_name)
      }
      if (sortBy === 'score_high') {
        return (b.percentage ?? -1) - (a.percentage ?? -1)
      }
      if (sortBy === 'score_low') {
        return (a.percentage ?? 101) - (b.percentage ?? 101)
      }
      if (sortBy === 'recent') {
        const aT = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        const bT = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
        return bT - aT
      }
      return 0
    })

    return list
  }, [data, filter, search, sortBy])

  const handleExportCSV = () => {
    if (!data) return
    const headers = [
      'No', 'Nama', 'NISN', 'Nomor Induk', 'Sub Kelas',
      'Status', 'Skor', 'Max', 'Persentase', 'Lulus',
      'Waktu Submit', 'Durasi (mnt)', 'Tab Switch', 'Flagged',
    ]
    const rows = data.students.map((s, i) => [
      i + 1,
      s.student_name,
      s.student_nisn,
      s.student_number,
      s.class_sub_group_name,
      STATUS_STYLE[s.status].label,
      s.total_score ?? '-',
      s.max_score ?? '-',
      s.percentage != null ? `${s.percentage.toFixed(1)}%` : '-',
      s.is_passed == null ? '-' : s.is_passed ? 'Ya' : 'Tidak',
      s.submitted_at ? formatDateTime(s.submitted_at) : '-',
      s.time_spent_seconds ? Math.round(s.time_spent_seconds / 60) : '-',
      s.tab_switch_count,
      s.is_flagged ? 'Ya' : 'Tidak',
    ])
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nilai_${data.schedule.exam_title.replace(/[^a-z0-9]/gi, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <HeaderBar onBack={() => navigate(-1)} />
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-tp-border bg-white">
          <Loader2 size={24} className="animate-spin text-tp-green" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl">
        <HeaderBar onBack={() => navigate(-1)} />
        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error || 'Data tidak ditemukan'}
        </div>
      </div>
    )
  }

  const { schedule, stats } = data

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <HeaderBar onBack={() => navigate(-1)} />

      {/* Schedule header card */}
      <div className="rounded-2xl border border-tp-border bg-white p-6">
        <h1 className="mb-2 text-xl font-bold text-tp-text">
          {schedule.exam_title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-tp-muted">
          <span>{schedule.subject}</span>
          <span>•</span>
          <span>{formatDate(schedule.schedule_date)}</span>
          <span>•</span>
          <span>
            {schedule.start_time} – {schedule.end_time}
          </span>
          {schedule.room && (
            <>
              <span>•</span>
              <span>{schedule.room}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox
          icon={<Users size={14} className="text-slate-500" />}
          label="Total"
          value={stats.total}
        />
        <StatBox
          icon={<CheckCircle2 size={14} className="text-emerald-500" />}
          label="Submit"
          value={stats.submitted}
        />
        <StatBox
          icon={<CheckCircle2 size={14} className="text-tp-green" />}
          label="Dinilai"
          value={stats.graded}
        />
        <StatBox
          icon={<AlertTriangle size={14} className="text-amber-500" />}
          label="Pending"
          value={stats.pending}
          highlight={stats.pending > 0}
        />
        <StatBox
          icon={<TrendingUp size={14} className="text-blue-500" />}
          label="Rata-rata"
          value={stats.average != null ? stats.average.toFixed(1) : '—'}
        />
        <StatBox
          icon={<Award size={14} className="text-purple-500" />}
          label="Lulus"
          value={`${stats.passed}/${stats.submitted}`}
        />
      </div>

      <div className="rounded-2xl border border-tp-border bg-white p-3">
        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'all', label: 'Semua', count: stats.total },
              { key: 'graded', label: 'Dinilai', count: stats.graded },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'passed', label: 'Lulus', count: stats.passed },
              { key: 'failed', label: 'Tidak Lulus', count: stats.failed },
              {
                key: 'not_started',
                label: 'Belum Mulai',
                count: stats.not_started,
              },
              { key: 'flagged', label: 'Flagged', count: stats.flagged },
            ] as const
          ).map(({ key, label, count }) => {
            const active = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
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

        {/* Search + sort + export */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NISN..."
              className="w-full rounded-lg border border-tp-border pl-9 pr-3 py-2 text-xs focus:border-tp-green focus:outline-none"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-tp-border bg-white px-3 py-2 text-xs focus:border-tp-green focus:outline-none"
          >
            <option value="name">Nama (A-Z)</option>
            <option value="score_high">Skor Tertinggi</option>
            <option value="score_low">Skor Terendah</option>
            <option value="recent">Terbaru Submit</option>
          </select>

          <button
            type="button"
            onClick={fetchData}
            className="grid h-9 w-9 place-items-center rounded-lg border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-tp-border bg-white px-3 py-2 text-xs font-semibold text-tp-muted hover:bg-slate-50"
          >
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 size={28} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-tp-text">
              Tidak ada siswa yang cocok
            </p>
            <p className="text-xs text-tp-muted">
              Coba ubah filter atau kata kunci.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-tp-border bg-slate-50">
                <tr>
                  <Th>Nama Siswa</Th>
                  <Th>NISN</Th>
                  <Th align="center">Status</Th>
                  <Th align="right">Skor</Th>
                  <Th align="right">%</Th>
                  <Th align="center">Lulus</Th>
                  <Th align="center">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const cfg = STATUS_STYLE[s.status]
                  const Icon = cfg.icon
                  return (
                    <tr
                      key={s.student_id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-tp-text">
                                {s.student_name}
                              </span>
                              {s.is_flagged && (
                                <span title="Flagged">
                                  <AlertTriangle
                                    size={11}
                                    className="text-rose-500"
                                  />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-tp-muted">
                              {s.class_sub_group_name}
                            </span>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <code className="text-[11px] text-tp-muted">
                          {s.student_nisn || '—'}
                        </code>
                      </Td>
                      <Td align="center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}
                        >
                          <Icon size={10} />
                          {cfg.label}
                          {s.pending_essay_count > 0 && (
                            <span className="ml-0.5">({s.pending_essay_count})</span>
                          )}
                        </span>
                      </Td>
                      <Td align="right">
                        {s.total_score != null ? (
                          <span className="text-sm font-bold text-tp-text">
                            {s.total_score}
                            <span className="text-tp-muted text-[10px]">
                              /{s.max_score}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-tp-faint">—</span>
                        )}
                      </Td>
                      <Td align="right">
                        {s.percentage != null ? (
                          <span
                            className={`text-sm font-bold ${
                              s.is_passed
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {s.percentage.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-tp-faint">—</span>
                        )}
                      </Td>
                      <Td align="center">
                        {s.is_passed === null ? (
                          <span className="text-[11px] text-tp-faint">—</span>
                        ) : s.is_passed ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={10} /> LULUS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            <XCircle size={10} /> GAGAL
                          </span>
                        )}
                      </Td>
                      <Td align="center">
                        <div className="flex items-center justify-center gap-1">
                          {s.submission_id && (
                            <>
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
                              {s.pending_essay_count > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/school-admin/dashboard/exam-schedules/${scheduleId}/submissions/${s.submission_id}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-amber-600"
                                  title="Koreksi essay"
                                >
                                  <Edit3 size={10} /> Koreksi
                                </button>
                              )}
                            </>
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

        {/* Footer */}
        <div className="border-t border-tp-border bg-slate-50/60 px-4 py-2 text-[11px] text-tp-muted">
          Menampilkan {filteredStudents.length} dari {data.students.length} siswa
          {stats.average != null && (
            <>
              {' • '}
              Rata-rata: <b className="text-tp-text">{stats.average.toFixed(1)}</b>
              {stats.highest != null && stats.lowest != null && (
                <>
                  {' • '}
                  Tertinggi: <b className="text-emerald-600">{stats.highest.toFixed(1)}</b>
                  {' • '}
                  Terendah: <b className="text-rose-600">{stats.lowest.toFixed(1)}</b>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function HeaderBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-medium text-tp-muted">
          Rekap Nilai Ujian
        </h1>
      </div>
    </div>
  )
}

function StatBox({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${
        highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-tp-border'
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
          {label}
        </span>
      </div>
      <div className="text-xl font-bold text-tp-text">{value}</div>
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
    return (e.response?.data as { error?: string } | undefined)?.error || e.message
  }
  if (e instanceof Error) return e.message
  return String(e)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}