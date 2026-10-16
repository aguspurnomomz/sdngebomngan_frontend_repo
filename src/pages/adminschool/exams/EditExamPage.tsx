import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import ExamStepper from './components/ExamStepper'
import ExamInfoForm from './components/ExamInfoForm'
import ExamQuestionBuilder from './components/ExamQuestionBuilder'
import ExamPreview from './components/ExamPreview'

export default function EditExamPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const API_URL = import.meta.env.VITE_API_URL

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [examStatus, setExamStatus] = useState<'draft' | 'published' | 'archived' | null>(null)
  const [data, setData] = useState<any>(null)

  // Fetch exam existing
  useEffect(() => {
    let cancelled = false
    const fetchExam = async () => {
      if (!examId) return
      setLoading(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await axios.get(`${API_URL}/api/school-admin/exams/${examId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        if (cancelled) return

        const exam = res.data.exam
        setExamStatus(exam.status)

        // Guard: hanya bisa edit kalau status = draft
        if (exam.status !== 'draft') {
          // Tetap set data untuk preview
          setData(mapExamToForm(exam))
          setLoading(false)
          return
        }

        setData(mapExamToForm(exam))
      } catch (e: any) {
        if (!cancelled) {
          setError(e.response?.data?.error || e.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchExam()
    return () => {
      cancelled = true
    }
  }, [examId, API_URL])


  const mapExamToForm = (exam: any) => {
    return {
      title: exam.title || '',
      description: exam.description || '',
      subject: exam.subject || '',
      exam_type: exam.exam_type || 'regular',
      grade_level: exam.grade_level || '',
      phase: exam.phase || '',
      academic_year_id: exam.academic_year_id || '',
      duration_minutes: exam.duration_minutes || 60,
      passing_score: exam.passing_score ?? 70,
      scoring_config: exam.scoring_config || {
        multiple_choice: 1,
        essay: 5,
        essay_rubric: 'manual',
      },
      questions: (exam.questions || []).map((q: any) => ({
        id: q.id || crypto.randomUUID(),
        type: q.type,
        order: q.order,
        question_text: q.question_text || '',
        options: q.options || null,
        correct_answer: q.correct_answer || '',
        answer_key: q.answer_key || '',
        rubric: q.rubric || [],
        explanation: q.explanation || '',
        cognitive_level: q.cognitive_level || '',
        score: q.score ?? (q.type === 'multiple_choice' ? 1 : 5),
        min_words: q.min_words ?? 0,
        image_url: q.image_url || '',
      })),
      targets: (exam.targets || []).map((t: any) => ({
        class_group_id: t.class_group_id || '',
        class_sub_group_id: t.class_sub_group_id || '',
      })),
    }
  }

  const handleSave = async (publish = false) => {
    if (!examId || !data) return
    setSubmitting(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.put(
        `${API_URL}/api/school-admin/exams/${examId}`,
        data,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )

      if (publish) {
        await axios.patch(
          `${API_URL}/api/school-admin/exams/${examId}/publish`,
          {},
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        )
      }

      navigate('/school-admin/dashboard/exams')
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setSubmitting(false)
    }
  }


  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
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


  if (error && !data) {
    return (
      <div className="mx-auto max-w-4xl">
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
          {error}
        </div>
      </div>
    )
  }

 
  if (examStatus && examStatus !== 'draft') {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/exams')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-tp-text">Ujian Tidak Bisa Diedit</h1>
            <p className="text-xs text-tp-muted">
              Status: <b className="capitalize">{examStatus}</b>
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100">
            <Lock size={22} className="text-amber-600" />
          </div>
          <p className="mb-1 text-sm font-bold text-amber-900">
            Hanya ujian berstatus draft yang bisa diubah
          </p>
          <p className="mb-5 text-xs text-amber-700">
            Ujian ini sudah dipublikasikan atau diarsipkan. Kamu masih bisa melihat detailnya,
            tapi tidak bisa melakukan perubahan.
          </p>

          {/* Preview read-only */}
          {data && (
            <div className="mb-5 text-left">
              <ExamPreview
                data={data}
                onBack={() => navigate('/school-admin/dashboard/exams')}
                onSaveDraft={() => {}}
                onPublish={() => {}}
                submitting={false}
                readOnly
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/school-admin/dashboard/exams')}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/school-admin/dashboard/exams')}
          className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-tp-text">Edit Ujian</h1>
          <p className="truncate text-xs text-tp-muted">{data.title || 'Belum diberi judul'}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
          Draft
        </span>
      </div>

      <ExamStepper current={step} />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {step === 1 && (
        <ExamInfoForm data={data} onChange={setData} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <ExamQuestionBuilder
          data={data}
          onChange={setData}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <ExamPreview
          data={data}
          onBack={() => setStep(2)}
          onSaveDraft={() => handleSave(false)}
          onPublish={() => handleSave(true)}
          submitting={submitting}
        />
      )}
    </div>
  )
}