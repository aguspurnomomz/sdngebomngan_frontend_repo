import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Rocket, Archive, Trash2, Copy, Printer,
  MoreVertical, FileText, Clock, Award, Users, Calendar,
  CheckCircle2, Circle, AlertCircle, Loader2, BookOpen,
  TrendingUp, Target, ChevronDown, ChevronUp, Download,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { getImageUrl } from './components/imageUploadHelper'

type ExamRubricItem = {
  criteria: string
  score: number
}

type ExamQuestionType = 'multiple_choice' | 'essay'

type ExamQuestion = {
  id: string
  type: ExamQuestionType
  order: number
  question_text: string
  image_url?: string 
  options?: Record<string, string> | null
  correct_answer?: string
  answer_key?: string
  rubric?: ExamRubricItem[]
  explanation?: string
  cognitive_level?: string
  score: number
  min_words?: number
}

type ExamTarget = {
  id: string
  class_group_id: string | null
  class_sub_group_id: string | null
  class_group_name: string
  class_sub_group_name: string
  class_level: string
}

type ExamStatus = 'draft' | 'published' | 'archived'

type ExamDetail = {
  id: string
  title: string
  description: string
  subject: string
  exam_type: string
  grade_level: string
  phase: string
  academic_year_id: string
  academic_year_name: string
  semester: string
  duration_minutes: number
  total_questions: number
  total_score: number
  passing_score: number
  auto_grade_mc: boolean
  manual_grade_essay: boolean
  status: ExamStatus
  is_active: boolean
  created_at: string
  updated_at: string
  published_at: string | null
  questions: ExamQuestion[]
  scoring_config: Record<string, unknown>
  targets: ExamTarget[]
}

type TargetGroup = {
  class_group_id: string | null
  class_group_name: string
  class_level: string
  sub_classes: ExamTarget[]
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  regular: 'Ulangan Harian',
  quiz: 'Quiz',
  uts: 'UTS',
  uas: 'UAS',
  tryout: 'Try Out',
  remedial: 'Remedial',
}

const STATUS_CONFIG: Record<
  ExamStatus,
  {
    label: string
    bg: string
    text: string
    icon: React.ComponentType<{ size?: number }>
    desc: string
  }
> = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    icon: Circle,
    desc: 'Belum dipublikasikan. Masih bisa diedit.',
  },
  published: {
    label: 'Published',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: CheckCircle2,
    desc: 'Sudah dipublikasikan. Siap dikerjakan siswa.',
  },
  archived: {
    label: 'Archived',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: Archive,
    desc: 'Diarsipkan. Tidak muncul untuk siswa baru.',
  },
}

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (
      (e.response?.data as { error?: string } | undefined)?.error ||
      e.message
    )
  }
  if (e instanceof Error) return e.message
  return String(e)
}

function formatDate(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function exportJSON(exam: ExamDetail) {
  const dataStr = JSON.stringify(exam, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exam.title.replace(/[^a-z0-9]/gi, '_')}_${exam.id.slice(0, 8)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


export default function ExamDetailPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const API_URL = import.meta.env.VITE_API_URL

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showQuestions, setShowQuestions] = useState(true)
  const [showAnswers, setShowAnswers] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)


  const fetchExam = useCallback(async () => {
    if (!examId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.get<{ exam: ExamDetail }>(
        `${API_URL}/api/school-admin/exams/${examId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setExam(res.data.exam)
    } catch (e: unknown) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [examId, API_URL])

  useEffect(() => {
    fetchExam()
  }, [fetchExam])

  // Close dropdown
  useEffect(() => {
    const handler = () => setOpenMenu(false)
    if (openMenu) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [openMenu])


  const handlePublish = async () => {
    if (!exam) return
    setActionLoading('publish')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.patch(
        `${API_URL}/api/school-admin/exams/${exam.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setConfirmPublish(false)
      await fetchExam()
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  const handleArchive = async () => {
    if (!exam) return
    setActionLoading('archive')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.patch(
        `${API_URL}/api/school-admin/exams/${exam.id}/archive`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setConfirmArchive(false)
      await fetchExam()
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!exam) return
    setActionLoading('delete')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.delete(`${API_URL}/api/school-admin/exams/${exam.id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      navigate('/school-admin/dashboard/exams')
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = () => {
    if (!exam) return
    sessionStorage.setItem('exam_duplicate_source', JSON.stringify(exam))
    navigate('/school-admin/dashboard/exams/create?duplicate=1')
  }

  const handlePrint = () => window.print()

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/exams')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-tp-text">Memuat ujian...</h1>
        </div>
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-tp-border bg-white">
          <Loader2 size={24} className="animate-spin text-tp-green" />
        </div>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/exams')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-tp-text">Gagal Memuat</h1>
        </div>
        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error || 'Ujian tidak ditemukan'}
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[exam.status]
  const StatusIcon = statusCfg.icon
  const totalMCQ = exam.questions.filter((q) => q.type === 'multiple_choice').length
  const totalEssay = exam.questions.filter((q) => q.type === 'essay').length

  // Group targets by class — sekarang fully typed
  const groupedTargets = exam.targets.reduce<Record<string, TargetGroup>>(
    (acc, t) => {
      const key = t.class_group_id || 'unknown'
      if (!acc[key]) {
        acc[key] = {
          class_group_id: t.class_group_id,
          class_group_name: t.class_group_name || 'Kelas',
          class_level: t.class_level || '',
          sub_classes: [],
        }
      }
      acc[key].sub_classes.push(t)
      return acc
    },
    {}
  )

  return (
    <div className="mx-auto max-w-5xl space-y-5 print:max-w-full">
      {/* Header bar */}
      <div className="flex items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/school-admin/dashboard/exams')}
          className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium text-tp-muted">Detail Ujian</h1>
        </div>

        <div className="flex items-center gap-2">
          {exam.status === 'draft' && (
            <button
              type="button"
              onClick={() => navigate(`/school-admin/dashboard/exams/${exam.id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3.5 py-2 text-xs font-semibold text-tp-text transition hover:bg-slate-50"
            >
              <Edit3 size={13} /> Edit
            </button>
          )}

          {exam.status === 'draft' && (
            <button
              type="button"
              onClick={() => setConfirmPublish(true)}
              disabled={actionLoading === 'publish'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-tp-green-hover disabled:opacity-50"
            >
              <Rocket size={13} />
              {actionLoading === 'publish' ? 'Loading...' : 'Publish'}
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="hidden h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50 sm:grid"
            title="Print / PDF"
          >
            <Printer size={14} />
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
                  icon={<Copy size={14} />}
                  label="Duplikat Ujian"
                  onClick={() => {
                    setOpenMenu(false)
                    handleDuplicate()
                  }}
                />
                <MenuAction
                  icon={<Printer size={14} />}
                  label="Print / Save PDF"
                  onClick={() => {
                    setOpenMenu(false)
                    handlePrint()
                  }}
                />
                <MenuAction
                  icon={<Download size={14} />}
                  label="Export JSON"
                  onClick={() => {
                    setOpenMenu(false)
                    exportJSON(exam)
                  }}
                />

                {(exam.status === 'draft' || exam.status === 'published') && (
                  <>
                    <div className="border-t border-tp-border" />
                    <MenuAction
                      icon={<Archive size={14} />}
                      label="Arsipkan"
                      onClick={() => {
                        setOpenMenu(false)
                        setConfirmArchive(true)
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

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white">
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text}`}
            >
              <StatusIcon size={11} />
              {statusCfg.label}
            </span>
            <span className="text-[11px] text-tp-muted">{statusCfg.desc}</span>
          </div>

          <h2 className="mb-2 text-xl font-bold text-tp-text sm:text-2xl">
            {exam.title}
          </h2>

          {exam.description && (
            <p className="mb-4 text-sm text-tp-muted">{exam.description}</p>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <Chip icon={<BookOpen size={11} />} label={exam.subject} tone="green" />
            <Chip label={EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type} />
            {exam.grade_level && <Chip label={`Kelas ${exam.grade_level}`} />}
            {exam.phase && <Chip label={exam.phase} />}
            {exam.academic_year_name && (
              <Chip label={`${exam.academic_year_name} • ${exam.semester}`} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-tp-border border-t border-tp-border sm:grid-cols-4 sm:divide-x">
          <StatBlock
            icon={<FileText size={16} className="text-blue-600" />}
            label="Total Soal"
            value={`${exam.total_questions}`}
            sub={`${totalMCQ} PG • ${totalEssay} Essay`}
          />
          <StatBlock
            icon={<Clock size={16} className="text-purple-600" />}
            label="Durasi"
            value={`${exam.duration_minutes}`}
            sub="menit"
          />
          <StatBlock
            icon={<Award size={16} className="text-amber-600" />}
            label="KKM"
            value={`${exam.passing_score}`}
            sub={`dari ${exam.total_score} poin`}
          />
          <StatBlock
            icon={<Users size={16} className="text-emerald-600" />}
            label="Target"
            value={`${exam.targets.length}`}
            sub={`sub kelas (${Object.keys(groupedTargets).length} kelas)`}
          />
        </div>
      </div>

      {/* Target Kelas */}
      <Section
        icon={<Target size={16} className="text-tp-green" />}
        title="Target Kelas"
        subtitle={`${exam.targets.length} sub kelas`}
      >
        <div className="space-y-3">
          {Object.values(groupedTargets).map((group) => (
            <div
              key={group.class_group_id ?? 'unknown'}
              className="rounded-xl border border-tp-border bg-slate-50/50 p-4"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-sm font-bold text-tp-text">
                  {group.class_group_name}
                </span>
                {group.class_level && (
                  <span className="rounded-md bg-tp-green/10 px-2 py-0.5 text-[10px] font-semibold text-tp-green">
                    Level {group.class_level}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-tp-muted">
                  {group.sub_classes.length} sub kelas
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.sub_classes.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-lg border border-tp-border bg-white px-2.5 py-1 text-[11px] font-medium text-tp-text"
                  >
                    {t.class_sub_group_name || 'Semua sub kelas'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Daftar Soal */}
      <Section
        icon={<FileText size={16} className="text-tp-green" />}
        title={`Daftar Soal (${exam.questions.length})`}
        subtitle={`${exam.total_score} poin total`}
        right={
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setShowAnswers((v) => !v)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                showAnswers
                  ? 'border-tp-green bg-tp-green/10 text-tp-green'
                  : 'border-tp-border bg-white text-tp-muted hover:bg-slate-50'
              }`}
            >
              {showAnswers ? '✓ ' : ''}
              Kunci Jawaban
            </button>
            <button
              type="button"
              onClick={() => setShowQuestions((v) => !v)}
              className="grid h-7 w-7 place-items-center rounded-lg border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
            >
              {showQuestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        }
      >
        {showQuestions && (
          <div className="space-y-3">
            {exam.questions
              .slice()
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((q, i) => (
                <QuestionView
                  key={q.id || i}
                  question={q}
                  index={i}
                  showAnswer={showAnswers}
                />
              ))}
          </div>
        )}
      </Section>

      {/* Metadata */}
      <Section
        icon={<Calendar size={16} className="text-tp-green" />}
        title="Metadata"
      >
        <div className="space-y-2.5">
          <MetaRow
            label="ID Ujian"
            value={<code className="text-[11px] text-tp-muted">{exam.id}</code>}
          />
          <MetaRow label="Dibuat" value={formatDate(exam.created_at)} />
          <MetaRow label="Terakhir diubah" value={formatDate(exam.updated_at)} />
          {exam.published_at && (
            <MetaRow
              label="Dipublikasikan"
              value={formatDate(exam.published_at)}
            />
          )}
          <MetaRow
            label="Auto-grade PG"
            value={exam.auto_grade_mc ? 'Ya' : 'Tidak'}
          />
          <MetaRow
            label="Koreksi Essay Manual"
            value={exam.manual_grade_essay ? 'Ya' : 'Tidak'}
          />
        </div>
      </Section>

      {/* Analytics */}
      <Section
        icon={<TrendingUp size={16} className="text-tp-green" />}
        title="Analitik Ujian"
        subtitle="Belum ada data"
      >
        <div className="rounded-xl border border-dashed border-tp-border bg-slate-50/50 p-6 text-center">
          <p className="text-xs text-tp-muted">
            Belum ada siswa yang mengerjakan ujian ini.
            <br />
            Analitik akan muncul setelah ada submission.
          </p>
        </div>
      </Section>

      {/* Modals */}
      {confirmDelete && (
        <ConfirmModal
          title="Hapus Ujian Permanen"
          message={`Yakin hapus "${exam.title}"? Tindakan ini tidak bisa dibatalkan dan semua soal akan hilang.`}
          confirmLabel={actionLoading === 'delete' ? 'Menghapus...' : 'Ya, Hapus'}
          tone="rose"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          loading={actionLoading === 'delete'}
        />
      )}

      {confirmArchive && (
        <ConfirmModal
          title="Arsipkan Ujian"
          message={`Arsipkan "${exam.title}"? Ujian tidak akan muncul untuk siswa baru, tapi data tetap tersimpan.`}
          confirmLabel={actionLoading === 'archive' ? 'Memproses...' : 'Ya, Arsipkan'}
          tone="amber"
          onCancel={() => setConfirmArchive(false)}
          onConfirm={handleArchive}
          loading={actionLoading === 'archive'}
        />
      )}

      {confirmPublish && (
        <ConfirmModal
          title="Publikasikan Ujian"
          message={`Publish "${exam.title}"? Setelah dipublish, ujian tidak bisa diedit lagi dan siap dikerjakan siswa.`}
          confirmLabel={actionLoading === 'publish' ? 'Memproses...' : 'Ya, Publish'}
          tone="green"
          onCancel={() => setConfirmPublish(false)}
          onConfirm={handlePublish}
          loading={actionLoading === 'publish'}
        />
      )}
    </div>
  )
}


function Section({
  icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-tp-border bg-white">
      <div className="flex items-center gap-2 border-b border-tp-border px-5 py-3.5">
        {icon}
        <h3 className="text-sm font-bold text-tp-text">{title}</h3>
        {subtitle && (
          <span className="text-[11px] text-tp-muted">• {subtitle}</span>
        )}
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
  value: string
  sub: string
}) {
  return (
    <div className="p-4">
      <div className="mb-1.5 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
          {label}
        </span>
      </div>
      <div className="text-lg font-bold text-tp-text">{value}</div>
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

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
      <span className="text-[11px] font-medium text-tp-muted">{label}</span>
      <span className="text-right text-[11px] font-semibold text-tp-text">
        {value}
      </span>
    </div>
  )
}

function QuestionView({
  question,
  index,
  showAnswer,
}: {
  question: ExamQuestion   // ← typed, no more any
  index: number
  showAnswer: boolean
}) {
  const isMCQ = question.type === 'multiple_choice'

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-tp-muted">#{index + 1}</span>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
            isMCQ ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isMCQ ? 'PG' : 'Essay'}
        </span>
        <span className="text-[11px] text-tp-muted">{question.score} poin</span>
        {question.cognitive_level && (
          <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {question.cognitive_level}
          </span>
        )}
        {/* Indikator gambar*/}
        {question.image_url && (
          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            🖼️ Gambar
          </span>
        )}
        {typeof question.min_words === 'number' && question.min_words > 0 && (
          <span className="text-[10px] text-tp-faint">
            Min. {question.min_words} kata
          </span>
        )}
      </div>

      {/* <p className="mb-3 text-sm text-tp-text whitespace-pre-wrap">
        {question.question_text}
      </p> */}

      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: question.question_text }}
      />

      {/* Gambar soal */}
      {question.image_url && (
        <div className="mb-3">
          <img
            src={getImageUrl(question.image_url)}
            alt="Gambar soal"
            className="max-h-80 max-w-full rounded-xl border border-tp-border bg-white object-contain"
            loading="lazy"
            onError={(e) => {
              console.error('[ExamDetailPage] Gagal load gambar:', question.image_url)
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Opsi PG */}
      {isMCQ && question.options && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {Object.entries(question.options).map(([key, val]) => {
            const isCorrect = showAnswer && question.correct_answer === key
            return (
              <div
                key={key}
                className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                  isCorrect
                    ? 'bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-white text-tp-muted'
                }`}
              >
                <span className="shrink-0 font-bold">{key}.</span>
                <span className="flex-1">{val}</span>
                {isCorrect && (
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Essay answer key */}
      {!isMCQ && showAnswer && question.answer_key && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase text-emerald-700">
            Kunci Jawaban
          </p>
          <p className="text-xs text-emerald-900 whitespace-pre-wrap">
            {question.answer_key}
          </p>
        </div>
      )}

      {/* Rubric — now typed, no TS error */}
      {!isMCQ && showAnswer && question.rubric && question.rubric.length > 0 && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase text-tp-muted">
            Rubrik Penilaian
          </p>
          <ul className="space-y-1">
            {question.rubric.map((r: ExamRubricItem, i: number) => (
              <li
                key={i}
                className="flex items-center justify-between text-[11px] text-tp-text"
              >
                <span>• {r.criteria}</span>
                <span className="font-bold text-tp-green">{r.score} poin</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explanation */}
      {showAnswer && question.explanation && (
        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase text-blue-700">
            Pembahasan
          </p>
          <p className="text-xs text-blue-900 whitespace-pre-wrap">
            {question.explanation}
          </p>
        </div>
      )}
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