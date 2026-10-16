import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit3, Users, Send, Archive, Trash2, Clock,FileText, Target, AlertCircle, Loader2, CheckCircle2} from 'lucide-react'
import { personalExamApi } from '../api'
import { usePersonalExamDetail } from '../../hooks/usePersonalExamDetail'
import { useAuthToken } from '@/features/hooks/useAuthToken'
import type { ExamCostPreview as CostType } from '../types'
import { ExamStatusBadge } from '../components/ExamStatusBadge'
import { ExamCostPreview } from '../components/ExamCostPreview'
import { ConfirmPublishModal } from '../components/ConfirmPublishModal'

export default function PersonalExamDetailPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const { token } = useAuthToken()
  const { exam, loading, error, refetch } = usePersonalExamDetail(examId)

  const [cost, setCost] = useState<CostType | null>(null)
  const [loadingCost, setLoadingCost] = useState(false)

  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState<{
    charged: number
    newBalance: number
  } | null>(null)

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)


  useEffect(() => {
    if (!exam || !token || !examId) return
    if (exam.status !== 'draft') {
      setCost(null)
      return
    }

    let cancelled = false
    const loadCost = async () => {
      setLoadingCost(true)
      try {
        const c = await personalExamApi.calculateCost(token, examId)
        if (!cancelled) setCost(c)
      } catch (e) {
        // silent
      } finally {
        if (!cancelled) setLoadingCost(false)
      }
    }
    loadCost()

    return () => { cancelled = true }
  }, [exam, token, examId])

  const handlePublish = async () => {
    if (!token || !examId) return

    setPublishing(true)
    setActionError(null)

    try {
      const result = await personalExamApi.publish(token, examId)
      setShowPublishModal(false)
      setPublishSuccess({
        charged: result.charged,
        newBalance: result.new_balance,
      })
      refetch()
    } catch (e: any) {
      console.error('Publish error:', e)
      const msg = e.response?.data?.error?.message
        || e.response?.data?.error
        || e.message
        || 'Gagal publish ujian'
      setActionError(msg)
      setShowPublishModal(false)
    } finally {
      setPublishing(false)
    }
  }

  const handleArchive = async () => {
    if (!token || !examId) return
    if (!confirm('Arsipkan ujian ini? Ujian akan dipindah ke status archived.')) return

    setActionLoading('archive')
    setActionError(null)
    try {
      await personalExamApi.archive(token, examId)
      refetch()
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message)
    } finally {
      setActionLoading(null)
    }
  }


  const handleDelete = async () => {
    if (!token || !examId) return
    if (
      !confirm(
        'Hapus ujian ini? Data tidak bisa dikembalikan. Ujian dengan submission tidak bisa dihapus — gunakan archive.',
      )
    )
      return

    setActionLoading('delete')
    setActionError(null)
    try {
      await personalExamApi.delete(token, examId)
      navigate('/personal-exams')
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message)
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-tp-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm text-rose-700">
          {error || 'Ujian tidak ditemukan'}
        </p>
        <button
          onClick={() => navigate('/personal-exams')}
          className="mt-3 text-xs font-semibold text-rose-700 underline"
        >
          Kembali ke daftar
        </button>
      </div>
    )
  }

  const isDraft = exam.status === 'draft'
  const isPublished = exam.status === 'published'
  //const isArchived = exam.status === 'archived'

  return (
    <div className="space-y-6 max-w-4xl">
      {publishSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              Ujian berhasil dipublish!
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              {publishSuccess.charged > 0 ? (
                <>
                  Token terpakai: <strong>{publishSuccess.charged}</strong> •
                  Saldo sekarang: <strong>{publishSuccess.newBalance}</strong>
                </>
              ) : (
                'Gratis (ditanggung sekolah)'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPublishSuccess(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

    
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/personal-exams')}
          className="grid h-9 w-9 place-items-center rounded-lg border border-tp-border bg-white hover:bg-slate-50 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-tp-muted" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ExamStatusBadge status={exam.status} />
            {exam.exam_type && exam.exam_type !== 'regular' && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                {exam.exam_type}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-tp-text">{exam.title}</h1>
          {exam.description && (
            <p className="text-xs text-tp-muted mt-1">{exam.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {isDraft && (
          <>
            <button
              type="button"
              onClick={() => navigate(`/personal-exams/${exam.id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3.5 py-2 text-xs font-semibold text-tp-muted hover:bg-slate-50"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>

            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              disabled={!cost || !cost.sufficient}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3.5 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" /> Publish
            </button>
          </>
        )}

        {isPublished && (
          <button
            type="button"
            onClick={() => navigate(`/personal-exams/${exam.id}/participants`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3.5 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            <Users className="h-3.5 w-3.5" /> Kelola Peserta
          </button>
        )}

        {(isDraft || isPublished) && (
          <button
            type="button"
            onClick={handleArchive}
            disabled={actionLoading === 'archive'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3.5 py-2 text-xs font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
          >
            {actionLoading === 'archive' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            Arsipkan
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={actionLoading === 'delete'}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 ml-auto"
        >
          {actionLoading === 'delete' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Hapus
        </button>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">{actionError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Total Soal"
          value={`${exam.total_questions}`}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Durasi"
          value={`${exam.duration_minutes} menit`}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Nilai Min"
          value={`${exam.passing_score}`}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Peserta"
          value={`${exam.participant_count ?? 0}`}
        />
      </div>

      {isDraft && (
        <ExamCostPreview cost={cost} loading={loadingCost} />
      )}

      <div className="rounded-2xl border border-tp-border bg-white p-5">
        <h2 className="text-sm font-bold text-tp-text border-b border-tp-border pb-2 mb-4">
          Daftar Soal ({exam.questions?.length ?? 0})
        </h2>

        {!exam.questions || exam.questions.length === 0 ? (
          <p className="text-xs text-tp-muted text-center py-6">
            Belum ada soal.
          </p>
        ) : (
          <div className="space-y-3">
            {exam.questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-xl border border-tp-border bg-slate-50/50 p-4"
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tp-green text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase text-tp-faint">
                        {q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}
                      </span>
                      <span className="text-[10px] font-mono text-tp-faint">
                        Score: {q.score}
                      </span>
                    </div>
                    <p className="text-sm text-tp-text whitespace-pre-wrap">
                      {q.question_text}
                    </p>
                  </div>
                </div>

                {q.type === 'multiple_choice' && q.options && (
                  <div className="ml-8 space-y-1">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx)
                      const isCorrect = q.correct_answer === letter
                      return (
                        <div
                          key={optIdx}
                          className={`rounded-md px-2 py-1 text-xs ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-tp-muted'
                          }`}
                        >
                          {opt}
                          {isCorrect && (
                            <span className="ml-2 text-[10px] font-semibold">
                              ✓ Jawaban benar
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.type === 'essay' && q.answer_key && (
                  <div className="ml-8 mt-2 rounded-md bg-blue-50 p-2 text-xs">
                    <span className="font-semibold text-blue-700">Kunci: </span>
                    <span className="text-blue-700">{q.answer_key}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmPublishModal
        open={showPublishModal}
        cost={cost}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublish}
        loading={publishing}
      />
    </div>
  )
}

function StatCard({
  icon, label, value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-tp-border bg-white p-3">
      <div className="flex items-center gap-1.5 text-tp-muted mb-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold text-tp-text">{value}</p>
    </div>
  )
}