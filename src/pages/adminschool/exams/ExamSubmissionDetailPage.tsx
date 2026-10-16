import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, AlertCircle, Loader2, CheckCircle2, XCircle,
  Clock, User as UserIcon, AlertTriangle, Save,
  ChevronLeft, ChevronRight, Flag, Calendar, Wifi,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'


type SubmissionStatus =
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'graded_with_pending'

type AnswerDetail = {
  question_id: string
  type: 'multiple_choice' | 'essay'
  answer: string
  max_score: number
  is_correct: boolean | null
  score: number | null
  // Essay-specific (filled after manual grading)
  feedback?: string
  graded_at?: string
}

type QuestionSnapshot = {
  id: string
  type: 'multiple_choice' | 'essay'
  order: number
  question_text: string
  options?: Record<string, string> | null
  correct_answer?: string
  answer_key?: string
  rubric?: Array<{ criteria: string; score: number }>
  explanation?: string
  cognitive_level?: string
  score: number
  min_words?: number
}

type SubmissionDetail = {
  id: string
  schedule_id: string
  exam_id: string
  exam_title: string
  subject: string
  student_id: string
  student_name: string
  student_nisn: string
  student_number: string
  class_sub_group_name: string
  status: SubmissionStatus
  started_at: string
  submitted_at: string | null
  last_activity_at: string | null
  time_spent_seconds: number | null
  total_score: number | null
  max_score: number | null
  percentage: number | null
  is_passed: boolean | null
  passing_score: number
  tab_switch_count: number
  is_flagged: boolean
  ip_address: string | null
  user_agent: string | null
  answers: AnswerDetail[]
  questions: QuestionSnapshot[]
}


const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; bg: string; text: string; icon: typeof Clock }
> = {
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
    label: 'Nilai Parsial',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: AlertTriangle,
  },
}

type FilterMode = 'all' | 'mc' | 'essay' | 'pending'

export default function ExamSubmissionDetailPage() {
  const navigate = useNavigate()
  const { scheduleId, submissionId } = useParams<{
    scheduleId: string
    submissionId: string
  }>()
  const API_URL = import.meta.env.VITE_API_URL

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [savingId, setSavingId] = useState<string | null>(null)


  const fetchDetail = useCallback(async () => {
    if (!submissionId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.get<{ submission: SubmissionDetail }>(
        `${API_URL}/api/school-admin/exam-submissions/${submissionId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setSubmission(res.data.submission)
    } catch (e: unknown) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [submissionId, API_URL])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])


  const handleSaveGrade = async (
    questionId: string,
    score: number,
    feedback: string
  ) => {
    if (!submissionId) return
    setSavingId(questionId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.patch(
        `${API_URL}/api/school-admin/exam-submissions/${submissionId}/grade-essay`,
        {
          question_id: questionId,
          score,
          feedback,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      await fetchDetail()
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setSavingId(null)
    }
  }


  const filteredAnswers = (() => {
    if (!submission) return []
    return submission.answers.filter((a) => {
      if (filter === 'all') return true
      if (filter === 'mc') return a.type === 'multiple_choice'
      if (filter === 'essay') return a.type === 'essay'
      if (filter === 'pending') {
        return a.type === 'essay' && (a.score === null || a.score === undefined)
      }
      return true
    })
  })()

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <HeaderBar
          onBack={() =>
            navigate(
              `/school-admin/dashboard/exam-schedules/${scheduleId}/monitor`
            )
          }
        />
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-tp-border bg-white">
          <Loader2 size={24} className="animate-spin text-tp-green" />
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="mx-auto max-w-4xl">
        <HeaderBar
          onBack={() =>
            navigate(
              `/school-admin/dashboard/exam-schedules/${scheduleId}/monitor`
            )
          }
        />
        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error || 'Submission tidak ditemukan'}
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[submission.status]
  const StatusIcon = statusCfg.icon
  const pendingCount = submission.answers.filter(
    (a) => a.type === 'essay' && (a.score === null || a.score === undefined)
  ).length

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <HeaderBar
        onBack={() =>
          navigate(
            `/school-admin/dashboard/exam-schedules/${scheduleId}/monitor`
          )
        }
      />

      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-tp-green text-xl font-bold text-white">
              {submission.student_name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-tp-text">
                  {submission.student_name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text}`}
                >
                  <StatusIcon size={11} />
                  {statusCfg.label}
                </span>
                {submission.is_flagged && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    <Flag size={10} /> FLAGGED
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-tp-muted">
                <span className="inline-flex items-center gap-1">
                  <UserIcon size={11} />
                  NISN: {submission.student_nisn || '—'}
                </span>
                {submission.class_sub_group_name && (
                  <>
                    <span>•</span>
                    <span>{submission.class_sub_group_name}</span>
                  </>
                )}
                <span>•</span>
                <span>{submission.exam_title}</span>
              </div>
            </div>
          </div>

          {/* Time & activity info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-3 text-[11px] text-tp-muted">
            {submission.time_spent_seconds != null && (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />
                Durasi: <b className="text-tp-text">
                  {Math.round(submission.time_spent_seconds / 60)} menit
                </b>
              </span>
            )}
            {submission.submitted_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} />
                Submit: <b className="text-tp-text">
                  {formatDateTime(submission.submitted_at)}
                </b>
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 ${
                submission.tab_switch_count > 0 ? 'text-rose-600' : ''
              }`}
            >
              <AlertTriangle size={11} />
              Tab switch: <b>{submission.tab_switch_count}×</b>
            </span>
            {submission.ip_address && (
              <span className="inline-flex items-center gap-1">
                <Wifi size={11} />
                IP: <b className="text-tp-text font-mono text-[10px]">{submission.ip_address}</b>
              </span>
            )}
          </div>
        </div>

        {/* Score summary */}
        <div className="grid grid-cols-2 divide-x divide-tp-border border-t border-tp-border sm:grid-cols-4">
          <ScoreBlock
            label="Skor Diperoleh"
            value={submission.total_score ?? 0}
            max={submission.max_score ?? 0}
            tone="primary"
          />
          <ScoreBlock
            label="Persentase"
            value={`${(submission.percentage ?? 0).toFixed(1)}%`}
            tone="muted"
          />
          <ScoreBlock
            label="KKM"
            value={submission.passing_score}
            tone="muted"
          />
          <ScoreBlock
            label="Status Kelulusan"
            value={
              submission.is_passed === null
                ? '—'
                : submission.is_passed
                ? 'LULUS'
                : 'TIDAK LULUS'
            }
            tone={submission.is_passed ? 'emerald' : 'rose'}
          />
        </div>

        {/* Pending notice */}
        {pendingCount > 0 && (
          <div className="border-t border-amber-200 bg-amber-50 px-6 py-3">
            <p className="text-xs font-semibold text-amber-800">
              ⚠ Ada {pendingCount} soal essay yang belum dinilai
            </p>
            <p className="text-[11px] text-amber-700">
              Skor di atas masih parsial. Klik "Belum Dinilai" di bawah untuk mulai mengoreksi.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-tp-border bg-white p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'all', label: 'Semua', count: submission.answers.length },
              {
                key: 'mc',
                label: 'Pilihan Ganda',
                count: submission.answers.filter((a) => a.type === 'multiple_choice').length,
              },
              {
                key: 'essay',
                label: 'Essay',
                count: submission.answers.filter((a) => a.type === 'essay').length,
              },
              { key: 'pending', label: 'Belum Dinilai', count: pendingCount },
            ] as const
          ).map(({ key, label, count }) => {
            const active = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-tp-green text-white'
                    : 'text-tp-muted hover:bg-slate-100'
                }`}
              >
                {label}
                <span
                  className={`rounded px-1.5 text-[10px] ${
                    active ? 'bg-white/25' : 'bg-slate-100'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {filteredAnswers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tp-border bg-white p-12 text-center">
          <p className="text-sm font-semibold text-tp-text">
            Tidak ada soal yang cocok
          </p>
          <p className="text-xs text-tp-muted">
            Coba ubah filter di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnswers.map((answer) => {
            const qIndex = submission.answers.findIndex(
              (a) => a.question_id === answer.question_id
            )
            return (
              <AnswerCard
                key={answer.question_id}
                answer={answer}
                index={qIndex}
                saving={savingId === answer.question_id}
                onSaveGrade={handleSaveGrade}
              />
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/school-admin/dashboard/exam-schedules/${scheduleId}/monitor`
            )
          }
          className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-5 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50"
        >
          <ChevronLeft size={14} /> Kembali ke Monitor
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/school-admin/dashboard/exam-schedules/${scheduleId}/grades`
            )
          }
          className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover"
        >
          Rekap Nilai <ChevronRight size={14} />
        </button>
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
          Detail Jawaban Siswa
        </h1>
      </div>
    </div>
  )
}

function ScoreBlock({
  label,
  value,
  max,
  tone,
}: {
  label: string
  value: string | number
  max?: number
  tone: 'primary' | 'muted' | 'emerald' | 'rose'
}) {
  const toneClasses = {
    primary: 'text-tp-green',
    muted: 'text-tp-text',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
  }
  return (
    <div className="p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${toneClasses[tone]}`}>
        {value}
        {max !== undefined && (
          <span className="text-sm text-tp-muted">/{max}</span>
        )}
      </p>
    </div>
  )
}

function AnswerCard({
  answer,
  index,
  saving,
  onSaveGrade,
}: {
  answer: AnswerDetail
  index: number
  saving: boolean
  onSaveGrade: (questionId: string, score: number, feedback: string) => void
}) {
  const [essayScore, setEssayScore] = useState<number>(answer.score ?? 0)
  const [feedback, setFeedback] = useState<string>(answer.feedback ?? '')

  const isMC = answer.type === 'multiple_choice'
  const isPending =
    answer.type === 'essay' && (answer.score === null || answer.score === undefined)

  // Reset local state when answer changes
  useEffect(() => {
    setEssayScore(answer.score ?? 0)
    setFeedback(answer.feedback ?? '')
  }, [answer.score, answer.feedback])

  const handleSave = () => {
    if (essayScore < 0 || essayScore > answer.max_score) {
      alert(`Skor harus antara 0 dan ${answer.max_score}`)
      return
    }
    onSaveGrade(answer.question_id, essayScore, feedback)
  }

  return (
    <div
      className={`rounded-2xl border bg-white ${
        isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-tp-border'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
        <span className="text-sm font-bold text-tp-text">
          Soal #{index + 1}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
            isMC ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isMC ? 'PG' : 'Essay'}
        </span>

        {/* Result badge */}
        {isMC && answer.is_correct !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
              answer.is_correct
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {answer.is_correct ? (
              <>
                <CheckCircle2 size={10} /> Benar
              </>
            ) : (
              <>
                <XCircle size={10} /> Salah
              </>
            )}
          </span>
        )}

        {isPending && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <AlertTriangle size={10} /> Belum Dinilai
          </span>
        )}

        {/* Score badge */}
        <span className="ml-auto text-xs font-bold text-tp-text">
          {answer.score != null ? `${answer.score}` : '—'}
          <span className="text-tp-muted">/{answer.max_score} poin</span>
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Question text — only shown if available from questions map */}
        {/* Note: question_text comes from questions snapshot, kita ambil via answers + separate questions array */}

        {isMC && (
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase text-tp-muted">
                Jawaban Siswa
              </p>
              <p className="text-sm font-semibold text-tp-text">
                {answer.answer || '(tidak dijawab)'}
              </p>
            </div>
          </div>
        )}

        {!isMC && (
          <div className="space-y-4">
            {/* Student Answer */}
            <div>
              <p className="mb-1.5 text-[11px] font-bold text-tp-muted">
                Jawaban Siswa
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-tp-text">
                  {answer.answer || '(tidak dijawab)'}
                </p>
              </div>
            </div>

            {/* Grading form */}
            <div className="rounded-xl border border-tp-green/30 bg-tp-green/5 p-4">
              <p className="mb-3 text-xs font-bold text-tp-green">
                Penilaian Essay
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
                    Skor (0 - {answer.max_score})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={answer.max_score}
                    step={0.5}
                    value={essayScore}
                    onChange={(e) => setEssayScore(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm font-bold focus:border-tp-green focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
                    Feedback (opsional)
                  </label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Catatan untuk siswa..."
                    className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick score buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-tp-muted">Cepat:</span>
                {[0, 0.5, 0.75, 1].map((ratio) => {
                  const val = answer.max_score * ratio
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setEssayScore(val)}
                      className="rounded-md border border-tp-border bg-white px-2 py-0.5 text-[10px] font-semibold text-tp-muted hover:bg-slate-50"
                    >
                      {val}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={12} /> Simpan Penilaian
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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