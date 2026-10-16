import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, MapPin, Users, Lock,
  RefreshCw, AlertCircle, Sparkles, FileText,
  Save, Trash2, RotateCcw, CheckCircle2, XCircle,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'


type ExamOption = {
  id: string
  title: string
  subject: string
  exam_type: string
  duration_minutes: number
  total_questions: number
  targets: Array<{
    class_group_id: string | null
    class_sub_group_id: string | null
    class_group_name: string
    class_sub_group_name: string
  }>
}

type SubClassTarget = {
  class_group_id: string
  class_group_name: string
  class_sub_group_id: string
  class_sub_group_name: string
  student_count: number
}

type DurationMode = 'strict' | 'flexible'

type ScheduleFormData = {
  exam_id: string
  schedule_date: string
  start_time: string
  end_time: string
  duration_mode: DurationMode
  duration_minutes: number
  selected_targets: string[]
  room: string
  supervisor_name: string
  session_notes: string
  access_code: string
  require_login: boolean
}

type AccessCodeStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'taken'; usedCount: number }
  | { state: 'error'; message: string }

  function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? 'border-tp-green bg-tp-green/5 ring-2 ring-tp-green/20'
          : 'border-tp-border hover:border-tp-green/40'
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
          active ? 'bg-tp-green text-white' : 'bg-slate-100 text-tp-muted'
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-tp-text">{title}</p>
        <p className="text-[11px] text-tp-muted">{desc}</p>
      </div>
    </button>
  )
}


function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (
      (e.response?.data as { error?: string } | undefined)?.error || e.message
    )
  }
  if (e instanceof Error) return e.message
  return String(e)
}

function isAccessCodeConflict(msg: string): boolean {
  const lower = msg.toLowerCase()
  return (
    lower.includes('kode akses') ||
    lower.includes('access_code') ||
    lower.includes('duplicate key') ||
    lower.includes('23505')
  )
}

const SUPERVISOR_SUGGESTIONS = [
  'Guru A', 'Guru Pengawas A', 'Guru Pengawas B', 'Guru Pengawas C', 'Guru Pengawas D',
]

const DRAFT_KEY = 'school_admin_exam_schedule_draft_v1'
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 

type StoredDraft = {
  form: ScheduleFormData
  mode: 'pick' | 'custom'
  savedAt: number
}

function readDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: StoredDraft = JSON.parse(raw)
    if (!parsed?.form || !parsed?.savedAt) return null
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

function isFormEmpty(f: ScheduleFormData): boolean {
  if (!f) return true
  return (
    !f.exam_id &&
    f.selected_targets.length === 0 &&
    !f.room.trim() &&
    !f.supervisor_name.trim() &&
    !f.session_notes.trim()
  )
}


export default function CreateExamSchedulePage() {
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'pick' | 'custom'>('pick')
  const [exams, setExams] = useState<ExamOption[]>([])
  const [selectedExam, setSelectedExam] = useState<ExamOption | null>(null)
  const [availableTargets, setAvailableTargets] = useState<SubClassTarget[]>([])

  const [form, setForm] = useState<ScheduleFormData>({
    exam_id: '',
    schedule_date: new Date().toISOString().slice(0, 10),
    start_time: '07:00',
    end_time: '08:30',
    duration_mode: 'strict',
    duration_minutes: 90,
    selected_targets: [],
    room: '',
    supervisor_name: '',
    session_notes: '',
    access_code: generateAccessCode(),
    require_login: false,
  })

  const [durationInput, setDurationInput] = useState('90')
  const [accessCodeStatus, setAccessCodeStatus] = useState<AccessCodeStatus>({ state: 'idle' })
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const draftRestoredRef = useRef(false)
  const isDirtyRef = useRef(false)
  const skipNextAutosaveRef = useRef(false)
  const accessCodeCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingLeaveRef = useRef<string | null>(null)

  const setField = <K extends keyof ScheduleFormData>(
    key: K,
    value: ScheduleFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    isDirtyRef.current = true
  }

  useEffect(() => {
    if (draftRestoredRef.current) return

    const draft = readDraft()
    if (!draft) {
      draftRestoredRef.current = true
      return
    }

    if (isFormEmpty(draft.form)) {
      clearDraft()
      draftRestoredRef.current = true
      return
    }

    setForm(draft.form)
    setMode(draft.mode || 'pick')
    setDurationInput(String(draft.form.duration_minutes || 90))
    setLastSavedAt(draft.savedAt)
    setDraftRestored(true)
    isDirtyRef.current = true
    draftRestoredRef.current = true
  }, [])


  useEffect(() => {
    if (!draftRestoredRef.current) return
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false
      return
    }

    if (isFormEmpty(form)) return

    const t = setTimeout(() => {
      writeDraft({ form, mode, savedAt: Date.now() })
      setLastSavedAt(Date.now())
    }, 800)

    return () => clearTimeout(t)
  }, [form, mode])


  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      if (isFormEmpty(form)) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form])

 
  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await axios.get<{ exams: ExamOption[] }>(
          `${API_URL}/api/school-admin/exams`,
          {
            params: { status: 'published' },
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }
        )
        setExams(res.data.exams || [])
      } catch (e: unknown) {
        setError(getErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [API_URL])


  useEffect(() => {
    if (!form.exam_id || exams.length === 0) return
    if (selectedExam?.id === form.exam_id) return

    const found = exams.find((e) => e.id === form.exam_id)
    if (found) setSelectedExam(found)
  }, [form.exam_id, exams, selectedExam])


  useEffect(() => {
    if (!selectedExam) {
      setAvailableTargets([])
      return
    }

    const fetchTargets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await axios.get<{ targets: SubClassTarget[] }>(
          `${API_URL}/api/school-admin/exam-schedules/available-targets`,
          {
            params: { exam_id: selectedExam.id },
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }
        )
        setAvailableTargets(res.data.targets || [])
      } catch (e: unknown) {
        setError(getErrorMessage(e))
      }
    }
    fetchTargets()

    if (!isDirtyRef.current || form.duration_minutes === 0) {
      setField('duration_minutes', selectedExam.duration_minutes)
      setDurationInput(String(selectedExam.duration_minutes))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExam])


  useEffect(() => {
    if (
      form.duration_mode === 'strict' &&
      form.start_time &&
      form.duration_minutes > 0
    ) {
      const end = addMinutes(form.start_time, form.duration_minutes)
      if (end !== form.end_time) {
        setForm((prev) => ({ ...prev, end_time: end }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.start_time, form.duration_minutes, form.duration_mode])


  useEffect(() => {
    if (
      form.duration_mode === 'strict' &&
      form.start_time &&
      form.end_time
    ) {
      const start = parseTimeToMinutes(form.start_time)
      const end = parseTimeToMinutes(form.end_time)
      let diff = end - start
      if (diff < 0) diff += 24 * 60
      if (diff > 0 && diff !== form.duration_minutes) {
        setForm((prev) => ({ ...prev, duration_minutes: diff }))
        setDurationInput(String(diff))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.start_time, form.end_time, form.duration_mode])


  useEffect(() => {
    // Clear timer sebelumnya
    if (accessCodeCheckTimerRef.current) {
      clearTimeout(accessCodeCheckTimerRef.current)
      accessCodeCheckTimerRef.current = null
    }

    const code = form.access_code.trim().toUpperCase()
    if (!code || code.length < 4) {
      setAccessCodeStatus({ state: 'idle' })
      return
    }

    setAccessCodeStatus({ state: 'checking' })

    accessCodeCheckTimerRef.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await axios.get<{ available: boolean; used_count: number }>(
          `${API_URL}/api/school-admin/exam-schedules/check-access-code`,
          {
            params: { code },
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }
        )
        if (res.data.available) {
          setAccessCodeStatus({ state: 'available' })
        } else {
          setAccessCodeStatus({ state: 'taken', usedCount: res.data.used_count })
        }
      } catch (e: unknown) {
        setAccessCodeStatus({ state: 'idle' })
      }
    }, 500)

    return () => {
      if (accessCodeCheckTimerRef.current) {
        clearTimeout(accessCodeCheckTimerRef.current)
      }
    }
  }, [form.access_code, API_URL])

  
  const toggleTarget = (subGroupId: string) => {
    setForm((prev) => {
      const exists = prev.selected_targets.includes(subGroupId)
      return {
        ...prev,
        selected_targets: exists
          ? prev.selected_targets.filter((id) => id !== subGroupId)
          : [...prev.selected_targets, subGroupId],
      }
    })
    isDirtyRef.current = true
  }

  const totalStudents = availableTargets
    .filter((t) => form.selected_targets.includes(t.class_sub_group_id))
    .reduce((sum, t) => sum + t.student_count, 0)

  const canSubmit =
    (mode === 'pick' ? !!form.exam_id : true) &&
    form.schedule_date &&
    form.start_time &&
    form.end_time &&
    form.duration_minutes > 0 &&
    form.selected_targets.length > 0 &&
    form.access_code.trim().length >= 4 &&
    accessCodeStatus.state !== 'taken'


  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const payload = {
        exam_id: form.exam_id,
        schedule_date: form.schedule_date,
        start_time: form.start_time,
        end_time: form.end_time,
        duration_mode: form.duration_mode,
        duration_minutes: form.duration_minutes,
        target_sub_group_ids: form.selected_targets,
        room: form.room,
        supervisor_name: form.supervisor_name,
        session_notes: form.session_notes,
        access_code: form.access_code.trim().toUpperCase(),
        require_login: form.require_login,
      }
      await axios.post(`${API_URL}/api/school-admin/exam-schedules`, payload, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      clearDraft()
      isDirtyRef.current = false
      setLastSavedAt(null)
      navigate('/school-admin/dashboard/exam-schedules')
    } catch (e: unknown) {
      const msg = getErrorMessage(e)

      if (isAccessCodeConflict(msg)) {
        const newCode = generateAccessCode()
        setForm((prev) => ({ ...prev, access_code: newCode }))
        setAccessCodeStatus({ state: 'idle' })
        setError(
          `Kode akses '${form.access_code}' sudah dipakai. Kode baru sudah di-generate: ${newCode}. Silakan submit ulang.`
        )
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = useCallback(() => {
    if (isDirtyRef.current && !isFormEmpty(form)) {
      pendingLeaveRef.current = '/school-admin/dashboard/exam-schedules'
      setShowLeaveConfirm(true)
      return
    }
    navigate('/school-admin/dashboard/exam-schedules')
  }, [form, navigate])

  const confirmLeave = () => {
    isDirtyRef.current = false
    const dest = pendingLeaveRef.current || '/school-admin/dashboard/exam-schedules'
    pendingLeaveRef.current = null
    setShowLeaveConfirm(false)
    navigate(dest)
  }

  const handleDiscardDraft = () => {
    if (!confirm('Buang draft jadwal yang tersimpan? Semua isian akan hilang.')) return
    clearDraft()
    setForm({
      exam_id: '',
      schedule_date: new Date().toISOString().slice(0, 10),
      start_time: '07:00',
      end_time: '08:30',
      duration_mode: 'strict',
      duration_minutes: 90,
      selected_targets: [],
      room: '',
      supervisor_name: '',
      session_notes: '',
      access_code: generateAccessCode(),
      require_login: false,
    })
    setDurationInput('90')
    setSelectedExam(null)
    setAvailableTargets([])
    setMode('pick')
    setDraftRestored(false)
    setLastSavedAt(null)
    setAccessCodeStatus({ state: 'idle' })
    isDirtyRef.current = false
    draftRestoredRef.current = true
  }

  const dismissRestoredBanner = () => {
    setDraftRestored(false)
  }

  const regenerateAccessCode = () => {
    const newCode = generateAccessCode()
    setField('access_code', newCode)
    setAccessCodeStatus({ state: 'idle' })
    setError(null)
  }


  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-tp-text">Memuat...</h1>
        </div>
        <div className="h-96 animate-pulse rounded-2xl border border-tp-border bg-white" />
      </div>
    )
  }

  const savedLabel = lastSavedAt
    ? `Tersimpan ${new Date(lastSavedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-tp-text">Buat Jadwal Ujian</h1>
          <p className="truncate text-xs text-tp-muted">
            Tentukan waktu, peserta, dan akses ujian
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

      {/* Banner draft dipulihkan */}
      {draftRestored && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <RotateCcw size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-amber-900">Draft Dipulihkan</p>
            <p className="text-[11px] text-amber-700">
              Kami menemukan draft jadwal ujian yang belum tersimpan di perangkat
              ini dan memulihkannya otomatis.
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
              <XCircle size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-rose-500 hover:text-rose-700"
            aria-label="Tutup"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-tp-border bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-tp-muted">
          Sumber Soal
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModeCard
            active={mode === 'pick'}
            onClick={() => setMode('pick')}
            icon={<FileText size={18} />}
            title="Ambil dari Bank Soal"
            desc="Pilih ujian yang sudah dipublish"
          />
          <ModeCard
            active={mode === 'custom'}
            onClick={() => setMode('custom')}
            icon={<Sparkles size={18} />}
            title="Buat Baru"
            desc="Buat soal baru + jadwal sekaligus"
          />
        </div>
      </div>


      {mode === 'pick' && (
        <div className="rounded-2xl border border-tp-border bg-white p-6">
          <label className="mb-2 block text-sm font-bold text-tp-text">
            Pilih Ujian <span className="text-rose-500">*</span>
          </label>

          {exams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-tp-border bg-slate-50/50 p-6 text-center">
              <p className="mb-1 text-sm font-semibold text-tp-text">
                Belum ada ujian published
              </p>
              <p className="text-xs text-tp-muted">
                Buat ujian dulu di menu "Kelola Ujian" atau pakai mode "Buat Baru".
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exams.map((e) => {
                const isSelected = form.exam_id === e.id
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        exam_id: e.id,
                        selected_targets: [],
                      }))
                      setSelectedExam(e)
                      isDirtyRef.current = true
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-tp-green bg-tp-green/5 ring-2 ring-tp-green/20'
                        : 'border-tp-border hover:border-tp-green/40'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-tp-text">
                          {e.title}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-tp-muted">
                          {e.subject}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-tp-muted">
                        <span>{e.total_questions} soal</span>
                        <span>•</span>
                        <span>{e.duration_minutes} menit</span>
                        <span>•</span>
                        <span>{e.targets.length} sub kelas target</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tp-green text-white text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {selectedExam && (
        <>
          <div className="rounded-2xl border border-tp-border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={16} className="text-tp-green" />
              <h3 className="text-sm font-bold text-tp-text">
                Mode & Waktu Pelaksanaan
              </h3>
            </div>

            {/* --- Pilih Mode Durasi --- */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold text-tp-text">
                Mode Durasi <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setField('duration_mode', 'strict')
                    const newEnd = addMinutes(
                      form.start_time,
                      form.duration_minutes
                    )
                    setForm((prev) => ({ ...prev, end_time: newEnd }))
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    form.duration_mode === 'strict'
                      ? 'border-tp-green bg-tp-green/5 ring-2 ring-tp-green/20'
                      : 'border-tp-border hover:border-tp-green/40'
                  }`}
                >
                  <Clock
                    size={16}
                    className={
                      form.duration_mode === 'strict'
                        ? 'text-tp-green mt-0.5'
                        : 'text-tp-muted mt-0.5'
                    }
                  />
                  <div>
                    <p className="text-xs font-bold text-tp-text">
                      Mengikat Jam
                    </p>
                    <p className="text-[10px] text-tp-muted">
                      Semua siswa mulai & selesai di jam yang sama.
                      <br />
                      Contoh: 07:00 - 08:00.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setField('duration_mode', 'flexible')}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    form.duration_mode === 'flexible'
                      ? 'border-tp-green bg-tp-green/5 ring-2 ring-tp-green/20'
                      : 'border-tp-border hover:border-tp-green/40'
                  }`}
                >
                  <RefreshCw
                    size={16}
                    className={
                      form.duration_mode === 'flexible'
                        ? 'text-tp-green mt-0.5'
                        : 'text-tp-muted mt-0.5'
                    }
                  />
                  <div>
                    <p className="text-xs font-bold text-tp-text">Fleksibel</p>
                    <p className="text-[10px] text-tp-muted">
                      Window waktu buka. Siswa mulai kapanpun asal selesai
                      dalam durasi.
                      <br />
                      Contoh: buka 09:00 - 18:00, durasi 60 menit.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* --- Tanggal + Jam --- */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.schedule_date}
                  onChange={(e) => setField('schedule_date', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                  {form.duration_mode === 'strict' ? 'Jam Mulai' : 'Jam Buka'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setField('start_time', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                  {form.duration_mode === 'strict' ? 'Jam Selesai' : 'Jam Tutup'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setField('end_time', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
                />
              </div>
            </div>

            {/* --- Durasi + Info --- */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                  Durasi Mengerjakan (menit){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={durationInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setDurationInput(raw)
                    const parsed = raw === '' ? 0 : parseInt(raw, 10)
                    setField('duration_minutes', parsed)
                  }}
                  onBlur={() => {
                    if (!durationInput || parseInt(durationInput, 10) === 0) {
                      setDurationInput('60')
                      setField('duration_minutes', 60)
                    } else {
                      const normalized = String(parseInt(durationInput, 10))
                      setDurationInput(normalized)
                      setField('duration_minutes', parseInt(normalized, 10))
                    }
                  }}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-tp-faint">
                  {form.duration_mode === 'strict'
                    ? 'Auto-adjust dari jam selesai.'
                    : 'Waktu maksimal siswa mengerjakan dari dia mulai.'}
                </p>
              </div>
              <div className="flex items-end">
                <div className="w-full rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <Clock size={12} className="mr-1 inline" />
                  {form.duration_mode === 'strict' ? (
                    <>
                      Ujian berjalan <b>{form.duration_minutes} menit</b>{' '}
                      (pukul {form.start_time} - {form.end_time})
                    </>
                  ) : (
                    <>
                      Siswa punya waktu <b>{form.duration_minutes} menit</b>{' '}
                      dari waktu mulai. Window buka pukul {form.start_time} -{' '}
                      {form.end_time}.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-tp-border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-tp-green" />
                <h3 className="text-sm font-bold text-tp-text">
                  Peserta Ujian
                </h3>
              </div>
              <span className="text-[11px] text-tp-muted">
                {form.selected_targets.length} sub kelas dipilih
              </span>
            </div>

            {availableTargets.length === 0 ? (
              <p className="text-xs text-tp-muted">Memuat daftar kelas...</p>
            ) : (
              <div className="space-y-2">
                {availableTargets.map((t) => {
                  const checked = form.selected_targets.includes(
                    t.class_sub_group_id
                  )
                  return (
                    <label
                      key={t.class_sub_group_id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                        checked
                          ? 'border-tp-green bg-tp-green/5'
                          : 'border-tp-border hover:border-tp-green/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleTarget(t.class_sub_group_id)}
                      />
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded border-2 ${
                          checked
                            ? 'border-tp-green bg-tp-green text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {checked && '✓'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-tp-text">
                          {t.class_sub_group_name}
                        </div>
                        <div className="text-[11px] text-tp-muted">
                          {t.class_group_name} • {t.student_count} siswa
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <div className="mt-4 rounded-xl bg-tp-green/5 p-3 text-center">
              <p className="text-xs text-tp-muted">
                Total peserta:{' '}
                <b className="text-tp-green">{totalStudents} siswa</b>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-tp-border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-tp-green" />
              <h3 className="text-sm font-bold text-tp-text">
                Detail Pelaksanaan
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                  Ruang
                </label>
                <input
                  type="text"
                  value={form.room}
                  onChange={(e) => setField('room', e.target.value)}
                  placeholder="Contoh: Lab Komputer 1"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                  Pengawas
                </label>
                <input
                  type="text"
                  list="supervisors"
                  value={form.supervisor_name}
                  onChange={(e) => setField('supervisor_name', e.target.value)}
                  placeholder="Nama pengawas"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
                />
                <datalist id="supervisors">
                  {SUPERVISOR_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                Catatan
              </label>
              <textarea
                rows={2}
                value={form.session_notes}
                onChange={(e) => setField('session_notes', e.target.value)}
                placeholder="Catatan untuk siswa (opsional)"
                className="w-full resize-none rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-tp-border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lock size={16} className="text-tp-green" />
              <h3 className="text-sm font-bold text-tp-text">Akses Siswa</h3>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tp-text">
                Kode Akses
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={form.access_code}
                    onChange={(e) => {
                      setField('access_code', e.target.value.toUpperCase())
                      setAccessCodeStatus({ state: 'idle' })
                    }}
                    maxLength={12}
                    className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 font-mono text-sm font-bold tracking-wider focus:outline-none ${
                      accessCodeStatus.state === 'taken'
                        ? 'border-rose-400 bg-rose-50 focus:border-rose-500'
                        : accessCodeStatus.state === 'available'
                        ? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500'
                        : 'border-tp-border focus:border-tp-green'
                    }`}
                  />
                  {/* Status icon di kanan input */}
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {accessCodeStatus.state === 'checking' && (
                      <RefreshCw size={14} className="animate-spin text-tp-muted" />
                    )}
                    {accessCodeStatus.state === 'available' && (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    )}
                    {accessCodeStatus.state === 'taken' && (
                      <XCircle size={14} className="text-rose-600" />
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={regenerateAccessCode}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-slate-50"
                >
                  <RefreshCw size={12} /> Generate
                </button>
              </div>

              {/* Status message */}
              {accessCodeStatus.state === 'taken' && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-600">
                  <XCircle size={11} />
                  Kode akses sudah dipakai ({accessCodeStatus.usedCount} jadwal
                  aktif). Generate ulang atau ubah kode.
                </p>
              )}
              {accessCodeStatus.state === 'available' && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600">
                  <CheckCircle2 size={11} />
                  Kode akses tersedia.
                </p>
              )}
              {accessCodeStatus.state === 'idle' && (
                <p className="mt-1.5 text-[10px] text-tp-faint">
                  Bagikan kode ini ke siswa untuk masuk ujian
                </p>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-tp-border p-3.5">
              <input
                type="checkbox"
                checked={form.require_login}
                onChange={(e) => setField('require_login', e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-tp-green"
              />
              <div>
                <span className="text-sm font-semibold text-tp-text">
                  Wajib login siswa
                </span>
                <p className="text-[11px] text-tp-muted">
                  Jika dicentang, siswa harus login pakai akun sekolah. Jika
                  tidak, siswa cukup input NISN + kode akses.
                </p>
              </div>
            </label>
          </div>
        </>
      )}

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          disabled={submitting}
          className="rounded-xl border border-tp-border bg-white px-5 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tp-green-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Menyimpan...' : 'Buat Jadwal'}
        </button>
      </div>


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
              Perubahan Anda sudah tersimpan sebagai <b>draft lokal</b> di
              perangkat ini. Anda bisa melanjutkannya nanti.
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
