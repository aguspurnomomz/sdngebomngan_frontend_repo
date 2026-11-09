import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, 
  AlertCircle, 
  //RefreshCw, 
  Plus, 
  Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../../lib/supabaseClient'

type Target = { class_group_id: string; class_sub_group_id: string }

// ==========================================
// Sesuai response actual dari /api/school-admin/subjects
// ==========================================
type Subject = {
  id: string
  name: string
  code: string | null
  description: string
  category: 'wajib' | 'mulok' | 'pilihan'
  is_active: boolean
  created_at: string
  updated_at: string
  teacher_count: number
}

type SubjectsResponse = {
  subjects: Subject[]
  total: number
}

type Props = {
  data: any
  onChange: (data: any) => void
  onNext: () => void
}

const FALLBACK_SUBJECTS: Subject[] = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
  'PPKn', 'Seni Budaya', 'PJOK', 'Informatika', 'Prakarya',
].map((name, i) => ({
  id: `fallback-${i}`,
  name,
  code: null,
  description: '',
  category: 'wajib',
  is_active: true,
  created_at: '',
  updated_at: '',
  teacher_count: 0,
}))

const EXAM_TYPES = [
  { value: 'regular', label: 'Ulangan Harian' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'uts', label: 'UTS' },
  { value: 'uas', label: 'UAS' },
  { value: 'tryout', label: 'Try Out' },
  { value: 'remedial', label: 'Remedial' },
]

const PHASES = ['Fase A', 'Fase B', 'Fase C', 'Fase D', 'Fase E', 'Fase F']

// ==========================================
// Label kategori untuk chip
// ==========================================
const CATEGORY_LABEL: Record<string, string> = {
  wajib: 'Wajib',
  mulok: 'Muatan Lokal',
  pilihan: 'Pilihan',
}

export default function ExamInfoForm({ data, onChange, onNext }: Props) {
  const API_URL = import.meta.env.VITE_API_URL
  const navigate = useNavigate()

  const [classes, setClasses] = useState<any[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [subjectsError, setSubjectsError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  // ==========================================
  // FETCH SUBJECTS
  // ==========================================
  const fetchSubjects = async () => {
    setLoadingSubjects(true)
    setSubjectsError(null)
    setUsingFallback(false)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesi tidak valid. Silakan login ulang.')
      }

      const res = await axios.get<SubjectsResponse>(
        `${API_URL}/api/school-admin/subjects`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      // Response: { subjects: [...], total: N }
      const list = res.data?.subjects ?? []

      // Filter hanya aktif & sort by name
      const active = list
        .filter((s) => s.is_active)
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))

      setSubjects(active)
    } catch (e: any) {
      console.error('[ExamInfoForm] Gagal memuat mapel:', e)
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        'Gagal memuat mata pelajaran'
      setSubjectsError(msg)
      // Fallback: guru tetap bisa lanjut pakai daftar default
      setSubjects(FALLBACK_SUBJECTS)
      setUsingFallback(true)
    } finally {
      setLoadingSubjects(false)
    }
  }

  // ==========================================
  // FETCH CLASSES (existing)
  // ==========================================
  const fetchClasses = async () => {
    setLoadingClasses(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.get(`${API_URL}/api/school-admin/exams/target-options`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      setClasses(res.data.classes || [])
    } catch (e) {
      console.error('Gagal memuat kelas:', e)
    } finally {
      setLoadingClasses(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
    fetchClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL])

  // ==========================================
  // Auto-select kalau cuma 1 subject
  // ==========================================
  useEffect(() => {
    if (!data.subject && subjects.length === 1 && !loadingSubjects) {
      setField('subject', subjects[0].name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, loadingSubjects])

  // ==========================================
  // Helper: ambil subject terpilih (untuk info tambahan)
  // ==========================================
  const selectedSubject = subjects.find((s) => s.name === data.subject)

  const setField = (field: string, value: any) =>
    onChange({ ...data, [field]: value })

  const toggleSubClass = (classGroupID: string, subClassID: string) => {
    const targets: Target[] = data.targets || []
    const exists = targets.find(
      (t) =>
        t.class_group_id === classGroupID &&
        t.class_sub_group_id === subClassID
    )
    const newTargets: Target[] = exists
      ? targets.filter(
          (t) =>
            !(
              t.class_group_id === classGroupID &&
              t.class_sub_group_id === subClassID
            )
        )
      : [
          ...targets,
          { class_group_id: classGroupID, class_sub_group_id: subClassID },
        ]
    setField('targets', newTargets)
  }

  const isSubClassSelected = (classGroupID: string, subClassID: string) =>
    (data.targets || []).some(
      (t: Target) =>
        t.class_group_id === classGroupID &&
        t.class_sub_group_id === subClassID
    )

  const canContinue =
    data.title?.trim() &&
    data.subject &&
    data.duration_minutes > 0 &&
    (data.targets || []).length > 0

  const subjectsEmpty = !loadingSubjects && !usingFallback && subjects.length === 0

  return (
    <div className="space-y-6 rounded-2xl border border-tp-border bg-white p-6">
      {/* Judul */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">
          Judul Ujian <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Contoh: UTS Matematika Kelas 8 Ganjil"
          className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* ============================================
            MATA PELAJARAN — Fetch dari endpoint
           ============================================ */}
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-tp-text">
            Mata Pelajaran <span className="text-rose-500">*</span>
            {usingFallback && (
              <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                Fallback
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={data.subject || ''}
              onChange={(e) => setField('subject', e.target.value)}
              disabled={loadingSubjects || subjectsEmpty}
              className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 pr-10 text-sm focus:border-tp-green focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-tp-muted"
            >
              <option value="">
                {loadingSubjects
                  ? 'Memuat mata pelajaran...'
                  : subjectsEmpty
                  ? 'Belum ada mata pelajaran'
                  : '-- Pilih Mata Pelajaran --'}
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                  {s.code ? ` (${s.code})` : ''}
                </option>
              ))}
            </select>

            {loadingSubjects && (
              <Loader2
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-tp-green"
              />
            )}
          </div>

          {/* ============================================
              Info subject terpilih (category + teacher count)
             ============================================ */}
          {selectedSubject && !loadingSubjects && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-tp-muted">
                {CATEGORY_LABEL[selectedSubject.category] ||
                  selectedSubject.category}
              </span>
              {selectedSubject.teacher_count > 0 && (
                <span className="text-[10px] text-tp-muted">
                  · {selectedSubject.teacher_count} guru pengampu
                </span>
              )}
            </div>
          )}

          {/* Fallback warning */}
          {usingFallback && (
            <div className="mt-1.5 flex items-start gap-1 text-[10px] text-amber-700">
              <AlertCircle size={10} className="mt-0.5 shrink-0" />
              <span className="flex-1">
                {subjectsError || 'Gagal memuat dari server. Memakai daftar default.'}
              </span>
              <button
                type="button"
                onClick={fetchSubjects}
                className="shrink-0 font-semibold underline hover:text-amber-900"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Empty state */}
          {subjectsEmpty && (
            <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-[10px] text-amber-800">
                Sekolah Anda belum memiliki mata pelajaran.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate('/school-admin/dashboard/subjects')
                }
                className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 underline hover:text-amber-900"
              >
                <Plus size={10} /> Tambah Mata Pelajaran
              </button>
            </div>
          )}
        </div>

        {/* Tipe Ujian */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">
            Tipe Ujian
          </label>
          <select
            value={data.exam_type || 'regular'}
            onChange={(e) => setField('exam_type', e.target.value)}
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          >
            {EXAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Kelas */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">
            Kelas
          </label>
          <input
            type="text"
            value={data.grade_level || ''}
            onChange={(e) => setField('grade_level', e.target.value)}
            placeholder="8"
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          />
        </div>
      </div>

      {/* Fase / Durasi / KKM / Tahun Akademik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">
            Fase
          </label>
          <select
            value={data.phase || ''}
            onChange={(e) => setField('phase', e.target.value)}
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          >
            <option value="">-- Pilih --</option>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">
            Durasi (menit) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={data.duration_minutes || 60}
            onChange={(e) =>
              setField('duration_minutes', parseInt(e.target.value) || 0)
            }
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">
            KKM
          </label>
          <input
            type="number"
            value={data.passing_score ?? 70}
            onChange={(e) =>
              setField('passing_score', parseFloat(e.target.value) || 0)
            }
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">
            Tahun Akademik
          </label>
          <input
            type="text"
            value={data.academic_year_id || ''}
            onChange={(e) => setField('academic_year_id', e.target.value)}
            placeholder="(opsional, isi UUID)"
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">
          Deskripsi
        </label>
        <textarea
          rows={3}
          value={data.description || ''}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Deskripsi singkat ujian (opsional)"
          className="w-full resize-none rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
        />
      </div>

      {/* Target Kelas (tidak berubah) */}
      <div className="rounded-xl border border-tp-border bg-slate-50/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target size={16} className="text-tp-green" />
          <h3 className="text-sm font-bold text-tp-text">
            Target Kelas <span className="text-rose-500">*</span>
          </h3>
          <span className="text-xs text-tp-muted">
            ({data.targets?.length || 0} sub kelas dipilih)
          </span>
        </div>

        {loadingClasses ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-tp-muted">
            <Loader2 size={12} className="animate-spin" />
            Memuat kelas...
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-tp-border bg-white p-6 text-center">
            <p className="text-xs text-tp-muted">
              Belum ada kelas. Tambahkan kelas terlebih dahulu di menu{' '}
              <b>Kelola Kelas</b>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((c) => (
              <div
                key={c.class_group_id}
                className="rounded-xl border border-tp-border bg-white p-3.5"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-tp-text">
                      {c.class_group_name}
                    </span>
                    <span className="ml-2 rounded-md bg-tp-green/10 px-2 py-0.5 text-[10px] font-semibold text-tp-green">
                      {c.level} • {c.class_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-tp-muted">
                    {c.academic_year_name} • {c.semester}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(c.sub_classes || []).map((sub: any) => (
                    <label
                      key={sub.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                        isSubClassSelected(c.class_group_id, sub.id)
                          ? 'border-tp-green bg-tp-green/5 font-semibold text-tp-green'
                          : 'border-tp-border bg-white text-tp-muted hover:border-tp-green/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSubClassSelected(
                          c.class_group_id,
                          sub.id
                        )}
                        onChange={() =>
                          toggleSubClass(c.class_group_id, sub.id)
                        }
                      />
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                          isSubClassSelected(c.class_group_id, sub.id)
                            ? 'border-tp-green bg-tp-green text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSubClassSelected(c.class_group_id, sub.id) && '✓'}
                      </span>
                      <span className="truncate">{sub.name}</span>
                    </label>
                  ))}
                  {(c.sub_classes || []).length === 0 && (
                    <div className="col-span-full text-[11px] text-tp-muted">
                      Belum ada sub kelas di kelas ini.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className="rounded-xl bg-tp-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tp-green-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Lanjut ke Soal →
        </button>
      </div>
    </div>
  )
}