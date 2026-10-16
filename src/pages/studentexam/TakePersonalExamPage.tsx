
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Clock, AlertCircle, BookOpen, Send, CheckCircle2, ChevronLeft,
  ChevronRight, Loader2, ShieldAlert,
} from 'lucide-react'
import { publicExamApi } from '@/features/personal-exam/api'
import type {
  PublicExamPreview, StartExamResponse, ExamQuestion,
} from '@/features/personal-exam/types'

type Step = 'loading' | 'invalid' | 'preview' | 'exam' | 'submitted'

export default function TakePersonalExamPage() {
  const [searchParams] = useSearchParams()
  const codeFromUrl = (searchParams.get('code') || '').toUpperCase().trim()
  const [step, setStep] = useState<Step>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<PublicExamPreview | null>(null)
  const [session, setSession] = useState<StartExamResponse | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const [result, setResult] = useState<{
    total_score: number
    max_score: number
    percentage: number
    is_passed: boolean
    has_pending_essay: boolean
  } | null>(null)

  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [timeLeft, setTimeLeft] = useState(0) // second
  //const [expired, setExpired] = useState(false)
  const submitRef = useRef<(() => void) | null>(null)

  // Tab switch detection
  const [tabSwitches, setTabSwitches] = useState(0)

  useEffect(() => {
    if (!codeFromUrl) {
      setErrorMsg('Kode akses tidak ditemukan di URL')
      setStep('invalid')
      return
    }

    let cancelled = false
    const validate = async () => {
      try {
        const data = await publicExamApi.getByCode(codeFromUrl)
        if (cancelled) return
        setPreview(data)
        setStep('preview')
      } catch (e: any) {
        if (cancelled) return
        setErrorMsg(
          e.response?.data?.error || e.message || 'Kode akses tidak valid',
        )
        setStep('invalid')
      }
    }
    validate()

    return () => { cancelled = true }
  }, [codeFromUrl])

  //handler
  const handleStart = async () => {
    if (!preview) return
    setStarting(true)
    try {
      const data = await publicExamApi.start(codeFromUrl)
      setSession(data)
      setStep('exam')

      const expiresAt = new Date(data.expires_at).getTime()
      const now = Date.now()
      const secs = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setTimeLeft(secs)
    } catch (e: any) {
      alert(e.response?.data?.error || e.message || 'Gagal memulai ujian')
    } finally {
      setStarting(false)
    }
  }

//submit
  const handleSubmit = useCallback(async () => {
    if (!session || submitting) return

    setSubmitting(true)
    try {
      const res = await publicExamApi.submit({
        session_token: session.session_token,
        answers,
        tab_switch_count: tabSwitches,
        time_spent_seconds: session.duration_minutes * 60 - timeLeft,
      })

      setResult({
        total_score: res.total_score,
        max_score: res.max_score,
        percentage: res.percentage,
        is_passed: res.is_passed,
        has_pending_essay: res.has_pending_essay || false,
      })
      setStep('submitted')
    } catch (e: any) {
      alert(
        e.response?.data?.error ||
          e.message ||
          'Gagal mengirim jawaban. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
      setShowConfirm(false)
    }
  }, [session, submitting, answers, tabSwitches, timeLeft])

  // Store submit ref untuk dipakai timer
  useEffect(() => {
    submitRef.current = handleSubmit
  }, [handleSubmit])


  useEffect(() => {
    if (step !== 'exam' || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          //setExpired(true)
          submitRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [step, timeLeft])


  useEffect(() => {
    if (step !== 'exam') return

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((n) => n + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleVisibility)
    }
  }, [step])


  useEffect(() => {
    if (step !== 'exam') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [step])


  const currentQ: ExamQuestion | null = useMemo(() => {
    if (!session?.questions) return null
    return session.questions[currentIdx] || null
  }, [session, currentIdx])

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length
  }, [answers])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleSelectOption = (questionId: string, optKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optKey }))
  }


  if (step === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-tp-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Memvalidasi kode akses...</p>
        </div>
      </div>
    )
  }


  if (step === 'invalid') {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-tp-border">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-50">
            <ShieldAlert className="h-7 w-7 text-rose-600" />
          </div>
          <h1 className="text-lg font-bold text-tp-text mb-2">
            Tidak Bisa Membuka Ujian
          </h1>
          <p className="text-sm text-tp-muted">{errorMsg}</p>
          {codeFromUrl && (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-mono text-tp-faint">
              Kode: {codeFromUrl}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (step === 'preview' && preview) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-tp-border">
          {/* Greeting */}
          <div className="text-center mb-5">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
              <BookOpen className="h-7 w-7 text-tp-green" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-tp-muted">
              Selamat datang
            </p>
            <h1 className="text-lg font-bold text-tp-text mt-1">
              {preview.student_name}
            </h1>
          </div>

          {/* Info card */}
          <div className="rounded-xl bg-slate-50 p-4 mb-5">
            <h2 className="text-sm font-bold text-tp-text mb-3">
              {preview.exam_title}
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-muted mb-0.5">
                  Soal
                </p>
                <p className="text-sm font-bold text-tp-text">
                  {preview.total_questions}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-muted mb-0.5">
                  Durasi
                </p>
                <p className="text-sm font-bold text-tp-text">
                  {preview.duration_minutes}m
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-muted mb-0.5">
                  KKM
                </p>
                <p className="text-sm font-bold text-tp-text">
                  {preview.passing_score}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-5 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 leading-relaxed">
              <p className="font-semibold mb-1">Perhatian:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Ujian hanya bisa dikerjakan <b>1 kali</b></li>
                <li>Waktu berjalan otomatis setelah mulai</li>
                <li>Jangan tutup tab saat mengerjakan</li>
              </ul>
            </div>
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-3 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memulai...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Mulai Mengerjakan
              </>
            )}
          </button>
        </div>
      </div>
    )
  }


  if (step === 'exam' && session && currentQ) {
    const isLowTime = timeLeft <= 60

    return (
      <div className="min-h-screen bg-slate-50 pb-28">
        <div className="sticky top-0 z-30 bg-white border-b border-tp-border shadow-sm">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
                {session.student_name}
              </p>
              <p className="text-sm font-bold text-tp-text truncate">
                {session.exam_title}
              </p>
            </div>

            <div
              className={`shrink-0 rounded-lg px-3 py-1.5 text-right ${
                isLowTime
                  ? 'bg-rose-50 text-rose-600 animate-pulse'
                  : 'bg-emerald-50 text-tp-green'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-base font-bold font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-tp-green transition-all"
              style={{
                width: `${((currentIdx + 1) / session.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-5 space-y-5">
          <div className="rounded-2xl bg-white border border-tp-border p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-tp-muted">
                Nomor Soal
              </span>
              <span className="text-[11px] text-tp-muted">
                Dijawab: <b className="text-tp-text">{answeredCount}</b> /{' '}
                {session.questions.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {session.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id]
                const isCurrent = idx === currentIdx
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-tp-green text-white ring-2 ring-tp-green/30'
                        : isAnswered
                          ? 'bg-emerald-50 text-tp-green border border-emerald-200'
                          : 'bg-slate-100 text-tp-muted border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-tp-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-tp-green">
                Soal {currentIdx + 1} dari {session.questions.length}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
                {currentQ.type === 'multiple_choice'
                  ? 'Pilihan Ganda'
                  : 'Essay'}
              </span>
            </div>

            <p className="text-base font-semibold text-tp-text leading-relaxed whitespace-pre-wrap mb-5">
              {currentQ.question_text}
            </p>

            {/* Options / Essay */}
            {currentQ.type === 'multiple_choice' && currentQ.options ? (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const optKey = String.fromCharCode(65 + optIdx)
                  const isSelected = answers[currentQ.id] === optKey
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, optKey)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm transition ${
                        isSelected
                          ? 'border-tp-green bg-emerald-50 text-tp-green font-semibold'
                          : 'border-tp-border bg-white text-tp-text hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-tp-muted mb-1.5">
                  Jawaban Anda
                </label>
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) =>
                    handleSelectOption(currentQ.id, e.target.value)
                  }
                  rows={6}
                  placeholder="Tulis jawaban lengkap Anda di sini..."
                  className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
                />
                <p className="mt-1.5 text-[10px] text-tp-faint">
                  Essay akan dinilai manual oleh guru
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-tp-border bg-white px-4 py-3 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>

            {currentIdx < session.questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIdx((p) =>
                    Math.min(session.questions.length - 1, p + 1),
                  )
                }
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-3 text-sm font-semibold text-white hover:bg-tp-green-hover"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-3 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Kumpulkan
              </button>
            )}
          </div>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !submitting && setShowConfirm(false)}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-tp-text text-center mb-2">
                Kumpulkan Jawaban?
              </h3>
              <p className="text-sm text-tp-muted text-center mb-5">
                Anda sudah menjawab <b>{answeredCount}</b> dari{' '}
                <b>{session.questions.length}</b> soal.
                {answeredCount < session.questions.length && (
                  <span className="block mt-1 text-amber-600 font-semibold">
                    Masih ada {session.questions.length - answeredCount} soal
                    kosong.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Ya, Kumpulkan'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (step === 'submitted' && result) {
    const passed = result.is_passed
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-tp-border">
          <div
            className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full ${
              passed ? 'bg-emerald-50' : 'bg-amber-50'
            }`}
          >
            {passed ? (
              <CheckCircle2 className="h-8 w-8 text-tp-green" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-600" />
            )}
          </div>

          <h1 className="text-xl font-bold text-tp-text mb-2">
            {passed ? 'Selamat, Anda Lulus!' : 'Ujian Selesai'}
          </h1>
          <p className="text-sm text-tp-muted mb-6">
            Jawaban Anda sudah tersimpan.
          </p>

          {/* Score Card */}
          <div className="rounded-xl bg-slate-50 p-5 mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted mb-1">
              Nilai Anda
            </p>
            <p
              className={`text-4xl font-bold mb-1 ${
                passed ? 'text-tp-green' : 'text-amber-600'
              }`}
            >
              {result.percentage.toFixed(1)}
            </p>
            <p className="text-xs text-tp-muted">
              {result.total_score} / {result.max_score} poin
            </p>
          </div>

          {result.has_pending_essay && (
            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 mb-5">
              ℹ️ Soal essay akan dinilai manual oleh guru. Nilai akhir akan
              diupdate setelah koreksi.
            </div>
          )}

          <p className="text-xs text-tp-muted">
            Terima kasih telah mengerjakan. Anda boleh menutup halaman ini.
          </p>
        </div>
      </div>
    )
  }

  return null
}