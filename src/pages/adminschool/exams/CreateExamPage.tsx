import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Copy, X, Save, Trash2, RotateCcw } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import ExamStepper from './components/ExamStepper'
import ExamInfoForm from './components/ExamInfoForm'
import ExamQuestionBuilder from './components/ExamQuestionBuilder'
import ExamPreview from './components/ExamPreview'

const DEFAULT_DATA = {
  title: '',
  description: '',
  subject: '',
  exam_type: 'regular',
  grade_level: '',
  phase: '',
  academic_year_id: '',
  duration_minutes: 60,
  passing_score: 0,
  scoring_config: { multiple_choice: 10, essay: 5, essay_rubric: 'manual' },
  questions: [],
  targets: [],
}


const DRAFT_KEY = 'school_admin_exam_draft_v1'
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 hari

type StoredDraft = {
  data: any
  step: number
  savedAt: number
}

function readDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: StoredDraft = JSON.parse(raw)
    if (!parsed?.data || !parsed?.savedAt) return null
    if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeDraft(payload: StoredDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

function isDataEmpty(d: any): boolean {
  if (!d) return true
  return (
    !d.title?.trim() &&
    !d.description?.trim() &&
    !d.subject?.trim() &&
    (d.questions?.length ?? 0) === 0 &&
    (d.targets?.length ?? 0) === 0
  )
}

export default function CreateExamPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const API_URL = import.meta.env.VITE_API_URL
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(DEFAULT_DATA)
  const [duplicateSource, setDuplicateSource] = useState<string | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const pendingLeaveRef = useRef<string | null>(null)
  const duplicateHandledRef = useRef(false)
  const draftRestoredRef = useRef(false)
  const isDirtyRef = useRef(false)
  const skipNextAutosaveRef = useRef(false)

  useEffect(() => {
    if (duplicateHandledRef.current) return

    const isDuplicate = searchParams.get('duplicate') === '1'
    if (!isDuplicate) return

    const src = sessionStorage.getItem('exam_duplicate_source')
    if (!src) {
      searchParams.delete('duplicate')
      setSearchParams(searchParams, { replace: true })
      return
    }

    try {
      const exam = JSON.parse(src)

      const nextData = {
        title: `${exam.title || 'Ujian'} (Copy)`,
        description: exam.description || '',
        subject: exam.subject || '',
        exam_type: exam.exam_type || 'regular',
        grade_level: exam.grade_level || '',
        phase: exam.phase || '',
        academic_year_id: exam.academic_year_id || '',
        duration_minutes: exam.duration_minutes || 60,
        passing_score: exam.passing_score ?? 70,
        scoring_config: exam.scoring_config || {
          multiple_choice: 10,
          essay: 5,
          essay_rubric: 'manual',
        },
        questions: (exam.questions || []).map((q: any, i: number) => ({
          ...q,
          id: crypto.randomUUID?.() || `q-${Date.now()}-${i}`,
          order: q.order ?? i + 1,
        })),
        targets: (exam.targets || []).map((t: any) => ({
          class_group_id: t.class_group_id || '',
          class_sub_group_id: t.class_sub_group_id || '',
        })),
      }

      clearDraft()
      skipNextAutosaveRef.current = false

      setData(nextData)
      isDirtyRef.current = true
      setDuplicateSource(exam.title || 'Ujian')
      draftRestoredRef.current = true // tandai agar restore draft di-skip
    } catch (e) {
      console.error('Gagal parsing exam_duplicate_source:', e)
      setError('Gagal memuat data duplikat. Silakan buat ujian baru dari awal.')
    } finally {
      sessionStorage.removeItem('exam_duplicate_source')
      searchParams.delete('duplicate')
      setSearchParams(searchParams, { replace: true })
      duplicateHandledRef.current = true
    }
  }, [])


  useEffect(() => {
    if (draftRestoredRef.current) return
    if (duplicateHandledRef.current) return 

    const draft = readDraft()
    if (!draft) {
      draftRestoredRef.current = true
      return
    }

    if (isDataEmpty(draft.data)) {
      clearDraft()
      draftRestoredRef.current = true
      return
    }

    setData(draft.data)
    setStep(Math.min(Math.max(draft.step || 1, 1), 3))
    setLastSavedAt(draft.savedAt)
    setDraftRestored(true)
    isDirtyRef.current = true
    draftRestoredRef.current = true
  }, [])


  useEffect(() => {
    if (!draftRestoredRef.current) return // tunggu restore selesai
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false
      return
    }

    if (isDataEmpty(data)) return

    const t = setTimeout(() => {
      writeDraft({ data, step, savedAt: Date.now() })
      setLastSavedAt(Date.now())
    }, 800)

    return () => clearTimeout(t)
  }, [data, step])


  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      if (isDataEmpty(data)) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [data])


  const handleSave = async (publish: boolean) => {
    setSubmitting(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const payload = {
        ...data,
        questions: (data.questions || []).map((q: any, i: number) => ({
          ...q,
          id: q.id || crypto.randomUUID?.() || `q-${Date.now()}-${i}`,
          order: q.order ?? i + 1,
        })),
      }

      const res = await axios.post(`${API_URL}/api/school-admin/exams`, payload, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      const examID = res.data.id

      if (publish) {
        await axios.patch(
          `${API_URL}/api/school-admin/exams/${examID}/publish`,
          {},
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        )
      }

      clearDraft()
      isDirtyRef.current = false
      setLastSavedAt(null)

      navigate('/school-admin/dashboard/exams')
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setSubmitting(false)
    }
  }


  const goBack = useCallback(() => {
    if (isDirtyRef.current && !isDataEmpty(data)) {
      pendingLeaveRef.current = '/school-admin/dashboard/exams'
      setShowLeaveConfirm(true)
      return
    }
    navigate('/school-admin/dashboard/exams')
  }, [data, navigate])

  const confirmLeave = () => {
    isDirtyRef.current = false
    const dest = pendingLeaveRef.current || '/school-admin/dashboard/exams'
    pendingLeaveRef.current = null
    setShowLeaveConfirm(false)
    navigate(dest)
  }

  const dismissDuplicateBanner = () => {
    setDuplicateSource(null)
  }

  const handleDiscardDraft = () => {
    if (!confirm('Buang draft yang tersimpan? Semua isian akan hilang.')) return
    clearDraft()
    setData(DEFAULT_DATA)
    setStep(1)
    setDraftRestored(false)
    setLastSavedAt(null)
    isDirtyRef.current = false
    draftRestoredRef.current = true
  }

  const dismissRestoredBanner = () => {
    setDraftRestored(false)
  }

  const savedLabel = lastSavedAt
    ? `Tersimpan ${new Date(lastSavedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-tp-text">
            {duplicateSource ? 'Duplikat Ujian' : 'Buat Ujian Baru'}
          </h1>
          <p className="truncate text-xs text-tp-muted">
            {duplicateSource
              ? `Menyalin dari: ${duplicateSource}`
              : 'Susun soal PG dan Essay dalam satu ujian'}
          </p>
        </div>

        {/* Indikator tersimpan */}
        {savedLabel && (
          <div className="hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 sm:flex">
            <Save size={12} />
            {savedLabel}
          </div>
        )}
      </div>

      {/* Banner duplicate info */}
      {duplicateSource && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
          <Copy size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-blue-900">Mode Duplikat</p>
            <p className="text-[11px] text-blue-700">
              Semua data soal dari <b>"{duplicateSource}"</b> sudah disalin ke form ini.
              Silakan edit dan simpan sebagai ujian baru.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissDuplicateBanner}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-blue-600 hover:bg-blue-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Banner draft dipulihkan */}
      {draftRestored && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <RotateCcw size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-amber-900">Draft Dipulihkan</p>
            <p className="text-[11px] text-amber-700">
              Kami menemukan draft ujian yang belum tersimpan di perangkat ini dan
              memulihkannya otomatis.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
            >
              <Trash2 size={12} /> Buang
            </button>
            <button
              type="button"
              onClick={dismissRestoredBanner}
              className="grid h-7 w-7 place-items-center rounded-lg text-amber-600 hover:bg-amber-100"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Stepper */}
      <ExamStepper current={step} />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Step content */}
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

      {/* Modal konfirmasi keluar */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-bold text-gray-900">
              Keluar dari Form?
            </h3>
            <p className="mb-6 text-center text-sm text-gray-600">
              Perubahan Anda sudah tersimpan sebagai <b>draft lokal</b> di perangkat ini.
              Anda bisa melanjutkannya nanti.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Lanjut Isi
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}