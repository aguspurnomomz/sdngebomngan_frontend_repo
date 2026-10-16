import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, AlertCircle, Loader2, Plus, Trash2, Info,
} from 'lucide-react'
import { personalExamApi } from '../api'
import { usePersonalExamDetail } from '../../hooks/usePersonalExamDetail'
import { useAuthToken } from '@/features/hooks/useAuthToken'
import type {
  ExamQuestion, CreatePersonalExamPayload, ExamCostPreview as CostType,
} from '../types'
import { ExamCostPreview } from '../components/ExamCostPreview'

export default function PersonalExamCreatePage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId?: string }>()
  const { token } = useAuthToken()
  const isEditMode = !!examId

  const { exam, loading: loadingExam, error: loadError } = usePersonalExamDetail(examId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [examType, setExamType] = useState('regular')
  const [gradeLevel, setGradeLevel] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [passingScore, setPassingScore] = useState(70)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [costPreview, setCostPreview] = useState<CostType | null>(null)


  useEffect(() => {
    if (isEditMode && exam) {
      setTitle(exam.title || '')
      setDescription(exam.description || '')
      setSubject(exam.subject || '')
      setExamType(exam.exam_type || 'regular')
      setGradeLevel(exam.grade_level || '')
      setDurationMinutes(exam.duration_minutes || 30)
      setPassingScore(exam.passing_score || 70)

      if (exam.questions && Array.isArray(exam.questions)) {
        setQuestions(exam.questions)
      }
    }
  }, [isEditMode, exam])


  useEffect(() => {
    if (!isEditMode || !examId || !token) return
    if (exam?.status !== 'draft') return

    const timer = setTimeout(async () => {
      try {
        const cost = await personalExamApi.calculateCost(token, examId)
        setCostPreview(cost)
      } catch (e) {
        // Ignore error untuk preview
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [isEditMode, examId, token, exam?.status, questions.length])


  const handleAddQuestion = (type: 'multiple_choice' | 'essay') => {
    const newQ: ExamQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      order: questions.length + 1,
      question_text: '',
      options: type === 'multiple_choice' ? ['A. ', 'B. ', 'C. ', 'D. '] : null,
      correct_answer: '',
      score: type === 'multiple_choice' ? 1 : 5,
    }
    setQuestions([...questions, newQ])
  }

  const handleUpdateQuestion = (idx: number, patch: Partial<ExamQuestion>) => {
    setQuestions((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], ...patch }
      return copy
    })
  }

  const handleDeleteQuestion = (idx: number) => {
    if (!confirm('Hapus soal ini?')) return
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev]
      const opts = [...(copy[qIdx].options || [])]
      opts[optIdx] = value
      copy[qIdx] = { ...copy[qIdx], options: opts }
      return copy
    })
  }

 
  const handleSave = async () => {
    if (!token) return

    // Validasi
    if (!title.trim()) {
      setSaveError('Judul ujian wajib diisi')
      return
    }
    if (!subject.trim()) {
      setSaveError('Mata pelajaran wajib diisi')
      return
    }
    if (questions.length === 0) {
      setSaveError('Minimal 1 soal harus ditambahkan')
      return
    }

    setSaving(true)
    setSaveError(null)

    const payload: CreatePersonalExamPayload = {
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      exam_type: examType,
      grade_level: gradeLevel.trim(),
      duration_minutes: durationMinutes,
      passing_score: passingScore,
      questions,
    }

    try {
      if (isEditMode && examId) {
        await personalExamApi.update(token, examId, payload)
        navigate(`/personal-exams/${examId}`)   
      } else {
        const result = await personalExamApi.create(token, payload)
        navigate(`/personal-exams/${result.id}`)  
      }
    } catch (e: any) {
      console.error('Save error:', e)
      setSaveError(e.response?.data?.error || e.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (isEditMode && loadingExam) {
    return (
      <div className="grid place-items-center py-20 text-tp-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (isEditMode && loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm text-rose-700">Gagal memuat ujian: {loadError}</p>
        <button
          onClick={() => navigate('/personal-exams')}
          className="mt-3 text-xs font-semibold text-rose-700 underline"
        >
          Kembali ke daftar
        </button>
      </div>
    )
  }

  const isLocked = isEditMode && exam?.status !== 'draft'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/personal-exams')}
          className="grid h-9 w-9 place-items-center rounded-lg border border-tp-border bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 text-tp-muted" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-tp-text">
            {isEditMode ? 'Edit Ujian' : 'Buat Ujian Baru'}
          </h1>
          <p className="text-xs text-tp-muted mt-0.5">
            Draft gratis — token dikenakan saat publish
          </p>
        </div>
      </div>

      {/* Warning kalau bukan draft */}
      {isLocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Ujian berstatus <strong>{exam?.status}</strong> — tidak bisa diedit.
            Hanya draft yang bisa diubah.
          </p>
        </div>
      )}

      {/* metadata section */}
      <div className="rounded-2xl border border-tp-border bg-white p-5 space-y-4">
        <h2 className="text-sm font-bold text-tp-text border-b border-tp-border pb-2">
          Informasi Ujian
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Judul Ujian <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLocked}
              placeholder="Contoh: Ujian Matematika Bab 1"
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50 disabled:text-tp-muted"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Deskripsi (opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLocked}
              rows={2}
              placeholder="Keterangan tambahan..."
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLocked}
              placeholder="Contoh: Matematika"
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Tipe Ujian
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            >
              <option value="regular">Regular</option>
              <option value="quiz">Quiz</option>
              <option value="uts">UTS</option>
              <option value="uas">UAS</option>
              <option value="tryout">Tryout</option>
              <option value="remedial">Remedial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Kelas / Tingkat
            </label>
            <input
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              disabled={isLocked}
              placeholder="Contoh: Kelas 8"
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Durasi (menit) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              disabled={isLocked}
              min={1}
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Nilai Minimum (KKM)
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(parseFloat(e.target.value) || 0)}
              disabled={isLocked}
              min={0}
              max={100}
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Question section */}
      <div className="rounded-2xl border border-tp-border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-tp-border pb-2">
          <h2 className="text-sm font-bold text-tp-text">
            Soal Ujian ({questions.length})
          </h2>
          {!isLocked && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_choice')}
                className="inline-flex items-center gap-1 rounded-lg border border-tp-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-tp-muted hover:bg-slate-50"
              >
                <Plus className="h-3 w-3" /> Pilihan Ganda
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('essay')}
                className="inline-flex items-center gap-1 rounded-lg border border-tp-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-tp-muted hover:bg-slate-50"
              >
                <Plus className="h-3 w-3" /> Essay
              </button>
            </div>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-tp-border rounded-xl">
            <Info className="h-6 w-6 text-tp-muted mx-auto mb-2" />
            <p className="text-xs text-tp-muted">
              Belum ada soal. Klik "+ Pilihan Ganda" atau "+ Essay" untuk mulai.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="rounded-xl border border-tp-border bg-slate-50/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-tp-green uppercase">
                    Soal #{qIdx + 1} — {q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}
                  </span>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="grid h-6 w-6 place-items-center rounded-md text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <textarea
                  value={q.question_text}
                  onChange={(e) =>
                    handleUpdateQuestion(qIdx, { question_text: e.target.value })
                  }
                  disabled={isLocked}
                  rows={2}
                  placeholder="Tulis pertanyaan di sini..."
                  className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
                />

                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${q.id}`}
                          checked={
                            q.correct_answer ===
                            String.fromCharCode(65 + optIdx)
                          }
                          onChange={() =>
                            handleUpdateQuestion(qIdx, {
                              correct_answer: String.fromCharCode(65 + optIdx),
                            })
                          }
                          disabled={isLocked}
                          className="shrink-0"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            handleUpdateOption(qIdx, optIdx, e.target.value)
                          }
                          disabled={isLocked}
                          placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                          className="flex-1 rounded-lg border border-tp-border bg-white px-2.5 py-1.5 text-xs focus:border-tp-green focus:outline-none"
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-tp-faint pl-6">
                      Pilih radio di kiri untuk menandai jawaban yang benar
                    </p>
                  </div>
                )}

                {q.type === 'essay' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-tp-muted mb-1">
                      Kunci Jawaban (untuk koreksi manual)
                    </label>
                    <textarea
                      value={q.answer_key || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(qIdx, { answer_key: e.target.value })
                      }
                      disabled={isLocked}
                      rows={2}
                      placeholder="Panduan jawaban benar..."
                      className="w-full rounded-lg border border-tp-border bg-white px-2.5 py-1.5 text-xs focus:border-tp-green focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="text-[11px] font-semibold text-tp-muted">
                    Skor:
                  </label>
                  <input
                    type="number"
                    value={q.score}
                    onChange={(e) =>
                      handleUpdateQuestion(qIdx, {
                        score: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={isLocked}
                    min={0}
                    step={0.5}
                    className="w-20 rounded-lg border border-tp-border bg-white px-2 py-1 text-xs focus:border-tp-green focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* preview */}
      {isEditMode && !isLocked && (
        <ExamCostPreview cost={costPreview} />
      )}

      {/* error message*/}
      {saveError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">{saveError}</p>
        </div>
      )}

    
      {!isLocked && (
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-tp-bg/90 backdrop-blur py-3 rounded-xl">
          <button
            type="button"
            onClick={() => navigate('/personal-exams')}
            disabled={saving}
            className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Simpan Draft
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}