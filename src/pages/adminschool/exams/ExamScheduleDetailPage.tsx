import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit3, PlayCircle, Trash2, MoreVertical, Calendar,
  Clock, MapPin, User as UserIcon,
  AlertCircle, Loader2, FileText, Award, Users, BookOpen,
  ChevronDown, ChevronUp, CheckCircle2, Circle, BarChart3,
  Lock, Unlock, Eye, RefreshCw,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import ExamAccessPanel from './components/ExamAccessPanel'

type ScheduleStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

type ScheduleDetail = {
  id: string
  exam_id: string
  exam_title: string
  exam_description: string
  subject: string
  exam_type: string
  grade_level: string
  phase: string
  total_questions: number
  total_score: number
  passing_score: number
  duration_minutes: number
  schedule_date: string
  start_time: string
  end_time: string
  room: string | null
  supervisor_name: string | null
  session_notes: string | null
  access_code: string | null
  require_login: boolean
  status: ScheduleStatus
  class_group_id: string | null
  class_group_name: string | null
  class_sub_group_id: string | null
  class_sub_group_name: string | null
  total_students: number
  total_submitted: number
  total_graded: number
  average_score: number | null
  highest_score: number | null
  lowest_score: number | null
  created_at: string
  updated_at: string
}

type StudentParticipant = {
  student_id: string
  full_name: string
  nisn: string
  student_number: string
  submission_id: string | null
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'graded_with_pending'
  total_score: number | null
  percentage: number | null
  is_passed: boolean | null
}

const STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; bg: string; text: string; dot: string; desc: string }
> = {
  scheduled: {
    label: 'Terjadwal',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    desc: 'Ujian belum dimulai. Siswa menunggu waktu mulai.',
  },
  ongoing: {
    label: 'Berlangsung',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500 animate-pulse',
    desc: 'Ujian sedang berlangsung. Siswa dapat mengerjakan.',
  },
  completed: {
    label: 'Selesai',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    desc: 'Ujian sudah selesai. Nilai tersedia.',
  },
  cancelled: {
    label: 'Dibatalkan',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    desc: 'Ujian dibatalkan. Tidak ada aktivitas.',
  },
}

const STUDENT_STATUS_CONFIG = {
  not_started: {
    label: 'Belum Mulai',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    icon: Circle,
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
    label: 'Dinilai',
    bg: 'bg-tp-green/10',
    text: 'text-tp-green',
    icon: CheckCircle2,
  },
  graded_with_pending: {
    label: 'Parsial',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: AlertCircle,
  },
} as const

export default function ExamScheduleDetailPage() {
  const navigate = useNavigate()
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const API_URL = import.meta.env.VITE_API_URL

  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null)
  const [students, setStudents] = useState<StudentParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStudents, setShowStudents] = useState(true)
  const [openMenu, setOpenMenu] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!scheduleId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.get<{
        schedule: ScheduleDetail
        students: StudentParticipant[]
      }>(`${API_URL}/api/school-admin/exam-schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      setSchedule(res.data.schedule)
      setStudents(res.data.students || [])
    } catch (e: unknown) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [scheduleId, API_URL])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  useEffect(() => {
    const handler = () => setOpenMenu(false)
    if (openMenu) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [openMenu])

  const handleDelete = async () => {
    if (!scheduleId) return
    setActionLoading('delete')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.delete(
        `${API_URL}/api/school-admin/exam-schedules/${scheduleId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      navigate('/school-admin/dashboard/exam-schedules')
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!scheduleId) return
    setActionLoading('cancel')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.patch(
        `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setConfirmCancel(false)
      await fetchDetail()
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/exam-schedules')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-tp-text">Memuat jadwal...</h1>
        </div>
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-tp-border bg-white">
          <Loader2 size={24} className="animate-spin text-tp-green" />
        </div>
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <div className="mx-auto max-w-5xl">
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
          {error || 'Jadwal tidak ditemukan'}
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[schedule.status]
  const progress =
    schedule.total_students > 0
      ? Math.round((schedule.total_submitted / schedule.total_students) * 100)
      : 0

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/school-admin/dashboard/exam-schedules')}
          className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium text-tp-muted">
            Detail Jadwal
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {(schedule.status === 'scheduled' || schedule.status === 'ongoing') && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/school-admin/dashboard/exam-schedules/${schedule.id}/monitor`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3.5 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
            >
              <PlayCircle size={13} /> Monitor
            </button>
          )}

          {schedule.status === 'scheduled' && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/school-admin/dashboard/exam-schedules/${schedule.id}/edit`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3.5 py-2 text-xs font-semibold text-tp-text hover:bg-slate-50"
            >
              <Edit3 size={13} /> Edit
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchDetail()}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenu((v) => !v)
              }}
              className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
            >
              <MoreVertical size={14} />
            </button>

            {openMenu && (
              <div
                className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-tp-border bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <MenuAction
                  icon={<Eye size={14} />}
                  label="Lihat Soal Ujian"
                  onClick={() => {
                    setOpenMenu(false)
                    navigate(`/school-admin/dashboard/exams/${schedule.exam_id}`)
                  }}
                />
                {schedule.status === 'completed' && (
                  <MenuAction
                    icon={<BarChart3 size={14} />}
                    label="Rekap Nilai"
                    onClick={() => {
                      setOpenMenu(false)
                      navigate(
                        `/school-admin/dashboard/exam-schedules/${schedule.id}/grades`
                      )
                    }}
                  />
                )}
                {(schedule.status === 'scheduled' ||
                  schedule.status === 'ongoing') && (
                  <>
                    <div className="border-t border-tp-border" />
                    <MenuAction
                      icon={<Lock size={14} />}
                      label="Batalkan Jadwal"
                      tone="amber"
                      onClick={() => {
                        setOpenMenu(false)
                        setConfirmCancel(true)
                      }}
                    />
                  </>
                )}
                <div className="border-t border-tp-border" />
                <MenuAction
                  icon={<Trash2 size={14} />}
                  label="Hapus Permanen"
                  tone="rose"
                  onClick={() => {
                    setOpenMenu(false)
                    setConfirmDelete(true)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-start gap-4">
            {/* Date block */}
            <div className="shrink-0 rounded-2xl bg-gradient-to-br from-tp-green to-emerald-600 p-4 text-white shadow-sm">
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                  {formatWeekday(schedule.schedule_date)}
                </div>
                <div className="mt-0.5 text-3xl font-bold">
                  {formatDay(schedule.schedule_date)}
                </div>
                <div className="text-[11px] font-semibold opacity-90">
                  {formatMonthYear(schedule.schedule_date)}
                </div>
              </div>
            </div>

            {/* Title + meta */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
                <span className="text-[11px] text-tp-muted">{statusCfg.desc}</span>
              </div>

              <h2 className="mb-2 text-xl font-bold text-tp-text">
                {schedule.exam_title}
              </h2>

              {schedule.exam_description && (
                <p className="mb-3 text-xs text-tp-muted">
                  {schedule.exam_description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <Chip
                  icon={<BookOpen size={11} />}
                  label={schedule.subject}
                  tone="green"
                />
                {schedule.class_sub_group_name && (
                  <Chip
                    icon={<Users size={11} />}
                    label={schedule.class_sub_group_name}
                  />
                )}
                {schedule.class_group_name && (
                  <Chip label={schedule.class_group_name} />
                )}
                <Chip label={schedule.exam_type} />
              </div>
            </div>
          </div>

          {/* Time bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-slate-50 p-3.5 text-xs text-tp-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-tp-green" />
              <b className="text-tp-text">
                {schedule.start_time} – {schedule.end_time}
              </b>
              <span>({schedule.duration_minutes} menit)</span>
            </span>
            {schedule.room && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-tp-green" />
                {schedule.room}
              </span>
            )}
            {schedule.supervisor_name && (
              <span className="inline-flex items-center gap-1.5">
                <UserIcon size={13} className="text-tp-green" />
                {schedule.supervisor_name}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="border-t border-tp-border bg-slate-50/60 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-tp-muted">
              Progress pengumpulan
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-tp-green transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-tp-text">
              {schedule.total_submitted}/{schedule.total_students} ({progress}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock
          icon={<Users size={16} className="text-blue-600" />}
          label="Total Peserta"
          value={schedule.total_students}
          sub="siswa terdaftar"
        />
        <StatBlock
          icon={<CheckCircle2 size={16} className="text-emerald-600" />}
          label="Sudah Submit"
          value={schedule.total_submitted}
          sub={`${progress}% selesai`}
        />
        <StatBlock
          icon={<Award size={16} className="text-amber-600" />}
          label="Dinilai"
          value={schedule.total_graded}
          sub={
            schedule.total_submitted > 0
              ? `${Math.round((schedule.total_graded / schedule.total_submitted) * 100)}% dari submit`
              : 'belum ada'
          }
        />
        <StatBlock
          icon={<BarChart3 size={16} className="text-purple-600" />}
          label="Rata-rata"
          value={
            schedule.average_score != null
              ? schedule.average_score.toFixed(1)
              : '—'
          }
          sub={
            schedule.highest_score != null && schedule.lowest_score != null
              ? `Max ${schedule.highest_score} · Min ${schedule.lowest_score}`
              : 'belum ada'
          }
        />
      </div>

      {schedule.access_code && schedule.status !== 'cancelled' && (
        <ExamAccessPanel
          accessCode={schedule.access_code}
          examTitle={schedule.exam_title}
          scheduleDate={schedule.schedule_date}
        />
      )}

      <Section
        icon={<Calendar size={16} className="text-tp-green" />}
        title="Detail Pelaksanaan"
      >
        <div className="space-y-2.5">
          <MetaRow label="Ruang" value={schedule.room || '—'} />
          <MetaRow
            label="Pengawas"
            value={schedule.supervisor_name || '—'}
          />
          <MetaRow
            label="Wajib Login"
            value={
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                  schedule.require_login
                    ? 'bg-tp-green/10 text-tp-green'
                    : 'bg-slate-100 text-tp-muted'
                }`}
              >
                {schedule.require_login ? (
                  <>
                    <Lock size={10} /> Ya
                  </>
                ) : (
                  <>
                    <Unlock size={10} /> Tidak
                  </>
                )}
              </span>
            }
          />
          <MetaRow
            label="Catatan"
            value={
              <span className="whitespace-pre-wrap text-tp-text">
                {schedule.session_notes || '—'}
              </span>
            }
          />
        </div>
      </Section>

      <Section
        icon={<FileText size={16} className="text-tp-green" />}
        title="Sumber Soal"
        right={
          <button
            type="button"
            onClick={() =>
              navigate(`/school-admin/dashboard/exams/${schedule.exam_id}`)
            }
            className="inline-flex items-center gap-1 rounded-lg border border-tp-border bg-white px-2.5 py-1 text-[11px] font-semibold text-tp-muted hover:bg-slate-50"
          >
            <Eye size={11} /> Lihat Soal
          </button>
        }
      >
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <h4 className="mb-2 text-sm font-bold text-tp-text">
            {schedule.exam_title}
          </h4>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-tp-muted">
            <span className="inline-flex items-center gap-1">
              <FileText size={11} />
              <b className="text-tp-text">{schedule.total_questions}</b> soal
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              <b className="text-tp-text">{schedule.duration_minutes}</b> menit
            </span>
            <span className="inline-flex items-center gap-1">
              <Award size={11} />
              KKM <b className="text-tp-text">{schedule.passing_score}</b>
            </span>
            <span className="inline-flex items-center gap-1">
              <BarChart3 size={11} />
              Total <b className="text-tp-text">{schedule.total_score}</b> poin
            </span>
          </div>
        </div>
      </Section>

      <Section
        icon={<Users size={16} className="text-tp-green" />}
        title={`Daftar Peserta (${students.length})`}
        right={
          <button
            type="button"
            onClick={() => setShowStudents((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            {showStudents ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        }
      >
        {showStudents && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-tp-muted">
                    Nama Siswa
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-tp-muted">
                    NISN
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-tp-muted">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-tp-muted">
                    Skor
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-xs text-tp-muted"
                    >
                      Belum ada siswa terdaftar di sub kelas ini.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const cfg = STUDENT_STATUS_CONFIG[s.status]
                    const Icon = cfg.icon
                    return (
                      <tr
                        key={s.student_id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-semibold text-tp-text">
                            {s.full_name}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <code className="text-[11px] text-tp-muted">
                            {s.nisn || '—'}
                          </code>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}
                          >
                            <Icon size={10} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {s.total_score != null ? (
                            <div className="flex flex-col items-end">
                              <span
                                className={`text-xs font-bold ${
                                  s.is_passed
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
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
                            <span className="text-[10px] text-tp-faint">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {confirmDelete && (
        <ConfirmModal
          title="Hapus Jadwal"
          message={`Yakin hapus jadwal "${schedule.exam_title}"? Semua submission siswa (jika ada) akan hilang dan tidak bisa dibatalkan.`}
          confirmLabel={actionLoading === 'delete' ? 'Menghapus...' : 'Ya, Hapus'}
          tone="rose"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          loading={actionLoading === 'delete'}
        />
      )}

      {confirmCancel && (
        <ConfirmModal
          title="Batalkan Jadwal"
          message={`Batalkan jadwal "${schedule.exam_title}"? Siswa tidak akan bisa masuk lagi, tapi data tetap tersimpan.`}
          confirmLabel={actionLoading === 'cancel' ? 'Memproses...' : 'Ya, Batalkan'}
          tone="amber"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={handleCancel}
          loading={actionLoading === 'cancel'}
        />
      )}
    </div>
  )
}

function Section({
  icon,
  title,
  right,
  children,
}: {
  icon: React.ReactNode
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-tp-border bg-white">
      <div className="flex items-center gap-2 border-b border-tp-border px-5 py-3.5">
        {icon}
        <h3 className="text-sm font-bold text-tp-text">{title}</h3>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatBlock({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub: string
}) {
  return (
    <div className="rounded-2xl border border-tp-border bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-tp-text">{value}</div>
      <div className="text-[10px] text-tp-faint">{sub}</div>
    </div>
  )
}

function Chip({
  icon,
  label,
  tone = 'slate',
}: {
  icon?: React.ReactNode
  label: string
  tone?: 'green' | 'slate'
}) {
  const tones: Record<'green' | 'slate', string> = {
    green: 'bg-tp-green/10 text-tp-green',
    slate: 'bg-slate-100 text-tp-muted',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}
    >
      {icon}
      {label}
    </span>
  )
}

function MetaRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
      <span className="text-[11px] font-medium text-tp-muted">{label}</span>
      <span className="text-right text-[11px] font-semibold text-tp-text">
        {value}
      </span>
    </div>
  )
}

function MenuAction({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'rose' | 'amber'
}) {
  const tones = {
    default: 'text-tp-text hover:bg-slate-50',
    rose: 'text-rose-600 hover:bg-rose-50',
    amber: 'text-amber-600 hover:bg-amber-50',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium transition ${tones[tone]}`}
    >
      {icon}
      {label}
    </button>
  )
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  tone = 'rose',
  onCancel,
  onConfirm,
  loading,
}: {
  title: string
  message: string
  confirmLabel: string
  tone?: 'rose' | 'amber' | 'green'
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const styles: Record<'rose' | 'amber' | 'green', string> = {
    rose: 'bg-rose-600 hover:bg-rose-700',
    amber: 'bg-amber-500 hover:bg-amber-600',
    green: 'bg-tp-green hover:bg-tp-green-hover',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-lg font-bold text-tp-text">{title}</h3>
        <p className="mb-6 text-sm text-tp-muted">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${styles[tone]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as { error?: string } | undefined)?.error || e.message
  }
  if (e instanceof Error) return e.message
  return String(e)
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { weekday: 'long' })
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric' })
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}