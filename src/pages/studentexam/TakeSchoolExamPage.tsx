import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { getImageUrl } from '../adminschool/exams/components/imageUploadHelper'
import QuestionContent from '../adminschool/exams/components/QuestionContent'
import axios from 'axios'
import {
  Clock, AlertCircle, Loader2, CheckCircle2, ChevronLeft,
  ChevronRight, Send, WifiOff, Wifi,
  BookOpen, User as UserIcon, KeyRound, AlertTriangle,
  Lock, RefreshCw, X,
} from 'lucide-react'
import {
  type ExamSnapshot,
  type ExamQuestion,
  type AnswerMap,
  saveSnapshot,
  loadSnapshot,
  saveAnswers,
  loadAnswers,
  saveTabSwitchCount,
  loadTabSwitchCount,
  clearAllForSchedule,
  queueSubmit,
  loadSubmitQueue,
  removeFromQueue,
} from '../../lib/examOfflineStorage'
import {
  subscribeExamControl,
  type ExamControlEvent,
} from '../../lib/examControlChannel'

const API_URL = import.meta.env.VITE_API_URL

type Phase = 'gate' | 'loading' | 'exam' | 'submitting' | 'result'

export default function TakeSchoolExamPage() {
  const [phase, setPhase] = useState<Phase>('gate')
  const [error, setError] = useState<string | null>(null)

  const [nisn, setNisn] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [studentName, setStudentName] = useState('')
  const [starting, setStarting] = useState(false)
  const [snapshot, setSnapshot] = useState<ExamSnapshot | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [timeLeft, setTimeLeft] = useState(0) 
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string>('')

  const [serverBlock, setServerBlock] = useState<{
    reason: string
    blockedAt: string
  } | null>(null)

  const [warningToast, setWarningToast] = useState<{
    message: string
    id: string
  } | null>(null)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    total_score: number
    max_score: number
    percentage: number
    is_passed: boolean
    message: string
  } | null>(null)

  const [lastShownWarningAt, setLastShownWarningAt] = useState<string | null>(null)

  const answersRef = useRef<AnswerMap>({})
  const tabSwitchCountRef = useRef(0)
  const timeLeftRef = useRef(0)
  const submittingRef = useRef(false)
  const autoSubmitTriggeredRef = useRef(false)
  const handleSubmitRef = useRef<(auto?: boolean) => void>(() => {})

  const currentQuestion = useMemo(
    () =>
      snapshot?.questions && snapshot.questions[currentIndex]
        ? snapshot.questions[currentIndex]
        : null,
    [snapshot, currentIndex]
  )


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const codeFromUrl = urlParams.get('code')
    if (codeFromUrl) {
      setAccessCode(codeFromUrl.toUpperCase())
    }

    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith('tp_exam_snapshot_')
      )
      for (const key of keys) {
        const scheduleId = key.replace('tp_exam_snapshot_', '')
        const snap = loadSnapshot(scheduleId)
        if (snap && new Date(snap.expires_at).getTime() > Date.now()) {
          setSnapshot(snap)
          setAnswers(loadAnswers(scheduleId))
          setTabSwitchCount(loadTabSwitchCount(scheduleId))
          setPhase('exam')
          break
        } else if (snap) {
          clearAllForSchedule(scheduleId)
        }
      }
    } catch {
      // ignore
    }
  }, [])


  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])


  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    tabSwitchCountRef.current = tabSwitchCount
  }, [tabSwitchCount])

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    submittingRef.current = submitting
  }, [submitting])


  useEffect(() => {
    if (phase !== 'exam' || !snapshot) return

    autoSubmitTriggeredRef.current = false

    const tick = () => {
      const expires = new Date(snapshot.expires_at).getTime()
      const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000))
      setTimeLeft(remaining)
      timeLeftRef.current = remaining 

      if (
        remaining <= 0 &&
        !autoSubmitTriggeredRef.current &&
        !submittingRef.current
      ) {
        autoSubmitTriggeredRef.current = true
        console.log('[TakeExam] ⏰ Timer habis — auto-submit triggered')
        handleAutoSubmit()
      }
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [phase, snapshot]) 


  useEffect(() => {
    if (phase !== 'exam') return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlocked(true)
        setBlockReason('Anda meninggalkan halaman ujian')
        setTabSwitchCount((prev) => {
          const next = prev + 1
          if (snapshot) saveTabSwitchCount(snapshot.schedule_id, next)
          return next
        })
      }
    }

    const handleBlur = () => {
      setIsBlocked(true)
      setBlockReason('Anda berpindah aplikasi / window')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [phase, snapshot])


  useEffect(() => {
    if (phase !== 'exam') return

    const preventCopy = (e: Event) => e.preventDefault()
    const preventContext = (e: Event) => e.preventDefault()

    document.addEventListener('copy', preventCopy)
    document.addEventListener('cut', preventCopy)
    document.addEventListener('contextmenu', preventContext)

    return () => {
      document.removeEventListener('copy', preventCopy)
      document.removeEventListener('cut', preventCopy)
      document.removeEventListener('contextmenu', preventContext)
    }
  }, [phase])


  useEffect(() => {
    if (phase !== 'exam' || !snapshot) return
    saveAnswers(snapshot.schedule_id, answers)
  }, [answers, phase, snapshot])


  useEffect(() => {
    if (phase !== 'exam') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])


  useEffect(() => {
    if (phase !== 'exam' || !snapshot) return

    console.log('[TakeExam] subscribing to exam-control channel...')

    const unsubscribe = subscribeExamControl(
      snapshot.schedule_id,
      (event: ExamControlEvent) => {
        const isForMe =
          event.session_token === snapshot.session_token ||
          event.student_id === snapshot.student_id

        if (!isForMe) return

        console.log('[TakeExam] received control event:', event)

        if (event.type === 'block') {
          setServerBlock({
            reason: event.reason || 'Diblokir oleh pengawas',
            blockedAt: new Date().toISOString(),
          })
          setIsBlocked(false)
        } else if (event.type === 'unblock') {
          setServerBlock(null)
          setWarningToast({
            message: 'Blokir dicabut. Anda dapat melanjutkan ujian.',
            id: Date.now().toString(),
          })
        } else if (event.type === 'warning') {
          setWarningToast({
            message: event.message || 'Peringatan dari pengawas',
            id: Date.now().toString(),
          })
        }
      }
    )

    return () => {
      console.log('[TakeExam] unsubscribing from exam-control channel')
      unsubscribe()
    }
  }, [phase, snapshot])


  useEffect(() => {
    if (!warningToast) return
    const timer = window.setTimeout(() => {
      setWarningToast(null)
    }, 8000)
    return () => window.clearTimeout(timer)
  }, [warningToast])


  const checkServerStatus = useCallback(async () => {
    if (!snapshot) return

    try {
      const res = await axios.get<{
        is_blocked: boolean
        blocked_reason: string
        blocked_at: string | null
        last_warning_at: string | null
        last_warning_message: string
        is_submitted: boolean
      }>(`${API_URL}/api/exam/${snapshot.session_token}/status`, {
        timeout: 5000,
      })

      const data = res.data

      // Handle block
      if (data.is_blocked) {
        setServerBlock((prev) => {
          if (prev) return prev
          return {
            reason: data.blocked_reason || 'Diblokir oleh pengawas',
            blockedAt: data.blocked_at || new Date().toISOString(),
          }
        })
        setIsBlocked(false)
      } else {
        setServerBlock((prev) => {
          if (prev) {
            setWarningToast({
              message: 'Blokir dicabut. Anda dapat melanjutkan ujian.',
              id: Date.now().toString(),
            })
          }
          return null
        })
      }

      if (
        data.last_warning_at &&
        data.last_warning_at !== lastShownWarningAt
      ) {
        setWarningToast({
          message: data.last_warning_message || 'Peringatan dari pengawas',
          id: Date.now().toString(),
        })
        setLastShownWarningAt(data.last_warning_at)
      }
    } catch (e) {
      console.warn('[TakeExam] status check failed:', e)
    }
  }, [snapshot, API_URL, lastShownWarningAt])


  useEffect(() => {
    if (phase !== 'exam' || !snapshot) return
    checkServerStatus()
  }, [phase, snapshot?.session_token]) 


  useEffect(() => {
    if (!isOnline || phase !== 'exam' || !snapshot) return
    checkServerStatus()
  }, [isOnline]) 

  useEffect(() => {
    if (phase !== 'exam' || !snapshot) return

    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        checkServerStatus()
      }
    }, 30000)

    return () => window.clearInterval(interval)
  }, [phase, snapshot?.session_token]) 


  useEffect(() => {
    if (!isOnline || !snapshot) return

    const retryQueue = async () => {
      const queue = loadSubmitQueue()
      const item = queue.find(
        (q) => q.session_token === snapshot.session_token
      )
      if (!item) return

      console.log('[TakeExam] retrying queued submit...')

      try {
        const res = await axios.post<{
          total_score: number
          max_score: number
          percentage: number
          is_passed: boolean
          message: string
        }>(`${API_URL}/api/exam/${item.session_token}/submit`, {
          answers: item.answers,
          tab_switch_count: item.tab_switch_count,
          time_spent_seconds: item.time_spent_seconds,
        })

        removeFromQueue(item.session_token)
        console.log('[TakeExam] queued submit retried successfully')

        setResult(res.data)
        clearAllForSchedule(snapshot.schedule_id)
        setPhase('result')
      } catch (e) {
        console.warn('[TakeExam] retry queued submit failed:', e)
      }
    }

    retryQueue()
  }, [isOnline, snapshot?.session_token]) 


  const handleSubmit = async (auto = false) => {
    if (!snapshot) return

    if (submittingRef.current) {
      console.log('[TakeExam] Already submitting — skip')
      return
    }

    if (serverBlock) {
      if (!auto) alert('Anda tidak bisa submit saat diblokir. Hubungi pengawas.')
      return
    }

    if (
      !auto &&
      !confirm('Yakin kirim jawaban? Anda tidak bisa mengubah setelah ini.')
    ) {
      return
    }

    const currentAnswers = answersRef.current
    const currentTabSwitch = tabSwitchCountRef.current
    const currentTimeLeft = timeLeftRef.current

    console.log('[TakeExam] Submit:', {
      auto,
      answersCount: Object.keys(currentAnswers).length,
      timeSpent: snapshot.duration_minutes * 60 - currentTimeLeft,
    })

    if (!isOnline) {
      setSubmitError(
        'Tidak ada koneksi internet. Jawaban tersimpan di perangkat, akan dikirim otomatis saat online.'
      )
      queueSubmit({
        session_token: snapshot.session_token,
        answers: currentAnswers,
        tab_switch_count: currentTabSwitch,
        time_spent_seconds: snapshot.duration_minutes * 60 - currentTimeLeft,
        queued_at: new Date().toISOString(),
      })
      return
    }

    setSubmitting(true)
    submittingRef.current = true
    setSubmitError(null)
    setPhase('submitting')

    const payload = {
      answers: currentAnswers,
      tab_switch_count: currentTabSwitch,
      time_spent_seconds: Math.max(
        0,
        snapshot.duration_minutes * 60 - currentTimeLeft
      ),
    }

    try {
      const res = await axios.post<{
        total_score: number
        max_score: number
        percentage: number
        is_passed: boolean
        message: string
      }>(`${API_URL}/api/exam/${snapshot.session_token}/submit`, payload)

      setResult(res.data)
      clearAllForSchedule(snapshot.schedule_id)
      setPhase('result')
    } catch (e: unknown) {
      setSubmitError(getErrorMessage(e))
      setPhase('exam')
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  })


  const handleAutoSubmit = useCallback(() => {
    if (!snapshot) return
    if (submittingRef.current) {
      console.log('[TakeExam] Auto-submit skipped: already submitting')
      return
    }
    console.log('[TakeExam] handleAutoSubmit → calling handleSubmit(true)')
    handleSubmitRef.current(true)
  }, [snapshot])


  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nisn.trim() || !accessCode.trim() || !studentName.trim()) {
      setError('Semua field wajib diisi')
      return
    }

    setStarting(true)
    setPhase('loading')

    try {
      const res = await axios.post<{
        session_token: string
        schedule_id: string
        exam_id: string
        student_id: string
        student_name: string
        student_nisn: string
        exam_title: string
        exam_subject: string
        duration_minutes: number
        passing_score: number
        total_score: number
        started_at: string
        expires_at: string
        questions: ExamQuestion[]
      }>(`${API_URL}/api/exam/start`, {
        nisn: nisn.trim(),
        access_code: accessCode.trim().toUpperCase(),
        student_name: studentName.trim(),
      })

      const snap: ExamSnapshot = {
        ...res.data,
        saved_at: new Date().toISOString(),
      }

      saveSnapshot(snap)
      setSnapshot(snap)
      setAnswers({})
      setCurrentIndex(0)
      setTabSwitchCount(0)
      setServerBlock(null)
      setWarningToast(null)
      autoSubmitTriggeredRef.current = false
      submittingRef.current = false
      setPhase('exam')
    } catch (e: unknown) {
      setError(getErrorMessage(e))
      setPhase('gate')
    } finally {
      setStarting(false)
    }
  }


  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value }
      answersRef.current = next // sync immediate
      return next
    })
  }


  if (phase === 'gate' || phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-tp-green text-white shadow-lg">
              <BookOpen size={28} />
            </div>
            <h1 className="text-2xl font-bold text-tp-text">Masuk Ujian</h1>
            <p className="mt-1 text-sm text-tp-muted">
              Masukkan data Anda untuk memulai ujian
            </p>
          </div>

          <form
            onSubmit={handleStart}
            className="space-y-4 rounded-2xl border border-tp-border bg-white p-6"
          >
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                NISN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tp-muted"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Nomor Induk Siswa Nasional"
                  disabled={phase === 'loading'}
                  className="w-full rounded-xl border border-tp-border pl-10 pr-3.5 py-3 text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                Nama Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nama lengkap sesuai absen"
                disabled={phase === 'loading'}
                className="w-full rounded-xl border border-tp-border px-3.5 py-3 text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                Kode Ujian <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tp-muted"
                />
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: MTK8A01"
                  maxLength={10}
                  disabled={phase === 'loading'}
                  className="w-full rounded-xl border border-tp-border pl-10 pr-3.5 py-3 font-mono text-sm font-bold tracking-wider focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20 disabled:opacity-50"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-tp-faint">
                Kode dari guru / pengawas ujian
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {!isOnline && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <WifiOff size={14} className="mt-0.5 shrink-0" />
                Tidak ada koneksi internet. Anda perlu online untuk memulai ujian.
              </div>
            )}

            <button
              type="submit"
              disabled={starting || !isOnline}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tp-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-tp-green-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting || phase === 'loading' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memuat soal...
                </>
              ) : (
                <>
                  <BookOpen size={16} />
                  Mulai Kerjakan
                </>
              )}
            </button>

            <div className="rounded-xl bg-slate-50 p-3 text-[10px] text-tp-muted">
              <p className="mb-1 font-semibold text-tp-text">💡 Perhatian:</p>
              <ul className="space-y-0.5">
                <li>• Soal di-download sekali, siap dikerjakan walau jaringan lemah</li>
                <li>• Jangan tutup atau refresh halaman saat mengerjakan</li>
                <li>• Berpindah tab akan tercatat sebagai aktivitas mencurigakan</li>
                <li>• Pengawas dapat mengirim peringatan atau memblokir secara realtime</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    )
  }


  if (phase === 'submitting') {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-tp-green" />
          <p className="text-lg font-semibold text-tp-text">Mengirim jawaban...</p>
          <p className="mt-1 text-sm text-tp-muted">Jangan tutup halaman ini</p>
        </div>
      </div>
    )
  }


  if (phase === 'result' && result) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-tp-border bg-white p-6 text-center">
            <div
              className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${
                result.is_passed
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              <CheckCircle2 size={32} />
            </div>

            <h1 className="mb-1 text-xl font-bold text-tp-text">
              Ujian Selesai
            </h1>
            <p className="mb-6 text-sm text-tp-muted">
              Jawaban Anda sudah tersimpan
            </p>

            <div className="mb-4 rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-muted">
                Skor Sementara (PG)
              </p>
              <p className="mt-1 text-4xl font-bold text-tp-text">
                {result.total_score}
                <span className="text-lg text-tp-muted">/{result.max_score}</span>
              </p>
              <p className="text-sm font-semibold text-tp-muted">
                {result.percentage.toFixed(1)}%
              </p>
            </div>

            <div
              className={`mb-6 rounded-xl p-3 text-sm font-semibold ${
                result.is_passed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {result.is_passed
                ? 'Anda LULUS (di atas KKM)'
                : 'Belum mencapai KKM'}
            </div>

            {result.message && (
              <p className="mb-6 text-xs text-tp-muted">{result.message}</p>
            )}

            <button
              type="button"
              onClick={() => window.close()}
              className="w-full rounded-xl border border-tp-border bg-white px-4 py-3 text-sm font-semibold text-tp-muted hover:bg-slate-50"
            >
              Tutup Halaman
            </button>
          </div>
        </div>
      </div>
    )
  }


  if (!snapshot || !currentQuestion) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-tp-muted">Memuat...</p>
      </div>
    )
  }

  const answeredCount = Object.values(answers).filter((v) => v?.trim()).length
  const totalQ = snapshot.questions.length
  const progress = Math.round((answeredCount / totalQ) * 100)
  const isTimeWarning = timeLeft < 5 * 60
  const isLastQuestion = currentIndex === totalQ - 1

  return (
    <div className="min-h-screen bg-slate-50">

      {serverBlock && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/95 backdrop-blur-sm p-4">
          <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-rose-100">
              <Lock size={36} className="text-rose-600" />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-rose-700">
              UJIAN DIBLOKIR
            </h2>
            <p className="mb-1 text-sm text-tp-text">
              Pengawas memblokir ujian Anda.
            </p>
            <p className="mb-5 text-xs text-tp-muted">
              Segera hubungi pengawas untuk informasi lebih lanjut. Halaman ini tidak
              bisa digunakan sampai blokir dinonaktifkan.
            </p>

            {serverBlock.reason && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  Alasan:
                </p>
                <p className="mt-0.5 text-sm text-rose-900">
                  {serverBlock.reason}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-tp-muted">
              <p className="mb-1">Sesi:</p>
              <code className="font-mono text-[10px] text-tp-text break-all">
                {snapshot.session_token}
              </code>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-tp-faint">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              Menunggu pengawas mencabut blokir...
            </div>
          </div>
        </div>
      )}

      {warningToast && (
        <div
          key={warningToast.id}
          className="fixed left-1/2 top-4 z-[150] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-slideDown"
        >
          <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-2xl">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-200">
              <AlertTriangle size={18} className="text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                Peringatan Pengawas
              </p>
              <p className="text-sm text-amber-900">{warningToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setWarningToast(null)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-amber-700 hover:bg-amber-200"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}


      {isBlocked && !serverBlock && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 backdrop-blur-sm p-4">
          <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-100">
              <Lock size={28} className="text-rose-600" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-rose-700">
              Ujian Diblokir
            </h2>
            <p className="mb-1 text-sm text-tp-text">{blockReason}</p>
            <p className="mb-5 text-xs text-tp-muted">
              Aktivitas ini tercatat. Jangan tinggalkan halaman ujian lagi.
            </p>
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
              Pelanggaran tercatat: <b>{tabSwitchCount}×</b>
            </div>
            <button
              type="button"
              onClick={() => setIsBlocked(false)}
              className="w-full rounded-xl bg-tp-green px-4 py-3 text-sm font-semibold text-white hover:bg-tp-green-hover"
            >
              Kembali ke Ujian
            </button>
          </div>
        </div>
      )}

      {/* Header sticky */}
      <header className="sticky top-0 z-40 border-b border-tp-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-tp-text">
              {snapshot.exam_title}
            </h1>
            <p className="truncate text-[11px] text-tp-muted">
              {snapshot.student_name} • {snapshot.exam_subject}
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
              isTimeWarning
                ? 'bg-rose-50 text-rose-700 animate-pulse'
                : 'bg-slate-100 text-tp-text'
            }`}
          >
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-tp-green transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-5 flex flex-wrap gap-1.5">
          {snapshot.questions.map((q, i) => {
            const answered = !!answers[q.id]?.trim()
            const active = i === currentIndex
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition ${
                  active
                    ? 'bg-tp-green text-white ring-2 ring-tp-green/30'
                    : answered
                    ? 'bg-tp-green/15 text-tp-green'
                    : 'bg-white text-tp-muted border border-tp-border hover:border-tp-green/40'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl border border-tp-border bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-tp-text">
              Soal #{currentIndex + 1}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                currentQuestion.type === 'multiple_choice'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {currentQuestion.type === 'multiple_choice' ? 'PG' : 'Essay'}
            </span>
            <span className="text-[11px] text-tp-muted">
              {currentQuestion.score} poin
            </span>
          </div>

          <QuestionContent 
            key={currentQuestion.id}
            html={currentQuestion.question_text} 
            className="mb-5 text-sm" 
          />

           {/* Gambar soal */}
          {currentQuestion.image_url && (
            <div className="mb-5">
              <img
                src={getImageUrl(currentQuestion.image_url)}
                alt="Gambar soal"
                className="max-h-96 w-full rounded-xl border border-tp-border bg-white object-contain"
                loading="eager"
                onError={(e) => {
                  console.error('[TakeExam] Gagal load gambar:', currentQuestion.image_url)
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}


          {currentQuestion.type === 'multiple_choice' &&
            currentQuestion.options && (
              <div className="space-y-2">
                {Object.entries(currentQuestion.options).map(([key, val]) => {
                  const selected = answers[currentQuestion.id] === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleAnswerChange(currentQuestion.id, key)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                        selected
                          ? 'border-tp-green bg-tp-green/5 ring-2 ring-tp-green/20'
                          : 'border-tp-border hover:border-tp-green/40 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold ${
                          selected
                            ? 'bg-tp-green text-white'
                            : 'bg-slate-100 text-tp-muted'
                        }`}
                      >
                        {key}
                      </span>
                      {/* <span className="flex-1 text-sm text-tp-text">{val}</span> */}
                      <QuestionContent 
                        html={val as string} 
                        className="flex-1 text-sm [&>p]:m-0" 
                      />
                    </button>
                  )
                })}
              </div>
            )}

          {currentQuestion.type === 'essay' && (
            <div>
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                placeholder="Tulis jawaban Anda di sini..."
                rows={8}
                className="w-full resize-none rounded-xl border border-tp-border p-3.5 text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-tp-muted">
                <span>
                  {
                    (answers[currentQuestion.id] || '')
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length
                  }{' '}
                  kata
                  {currentQuestion.min_words && currentQuestion.min_words > 0 && (
                    <> • minimal {currentQuestion.min_words} kata</>
                  )}
                </span>
                {currentQuestion.min_words &&
                  currentQuestion.min_words > 0 &&
                  (answers[currentQuestion.id] || '')
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length < currentQuestion.min_words && (
                    <span className="text-amber-600">
                      <AlertCircle size={10} className="mr-1 inline" />
                      Belum cukup kata
                    </span>
                  )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Sebelumnya
          </button>

          <span className="text-xs text-tp-muted">
            {answeredCount}/{totalQ} dijawab
          </span>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(totalQ - 1, i + 1))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover"
            >
              Selanjutnya <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!!serverBlock}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send size={14} /> Selesai & Kirim
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{submitError}</p>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                <RefreshCw size={10} /> Coba Lagi
              </button>
            </div>
          </div>
        )}

        {tabSwitchCount > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Anda sudah meninggalkan halaman ujian <b>{tabSwitchCount}×</b>.
              Aktivitas ini akan dilaporkan ke pengawas.
            </span>
          </div>
        )}

        {!isOnline && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <WifiOff size={14} className="mt-0.5 shrink-0" />
            <span>
              Koneksi terputus. Anda tetap bisa mengerjakan. Jawaban tersimpan
              otomatis di perangkat dan akan dikirim saat online.
            </span>
          </div>
        )}

        {!isLastQuestion && (
          <div className="mt-5 rounded-2xl border border-tp-border bg-white p-4 text-center">
            <p className="mb-2 text-xs text-tp-muted">
              Sudah yakin dengan semua jawaban?
            </p>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!!serverBlock}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send size={14} /> Selesai & Kirim Sekarang
            </button>
          </div>
        )}
      </main>
    </div>
  )
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

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}