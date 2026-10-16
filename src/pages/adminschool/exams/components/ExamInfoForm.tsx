import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target } from 'lucide-react'

type Target = { class_group_id: string; class_sub_group_id: string }

type Props = {
  data: any
  onChange: (data: any) => void
  onNext: () => void
}

const SUBJECTS = ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS', 'PPKn', 'Seni Budaya', 'PJOK', 'Informatika', 'Prakarya']
const EXAM_TYPES = [
  { value: 'regular', label: 'Ulangan Harian' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'uts', label: 'UTS' },
  { value: 'uas', label: 'UAS' },
  { value: 'tryout', label: 'Try Out' },
  { value: 'remedial', label: 'Remedial' },
]
const PHASES = ['Fase A', 'Fase B', 'Fase C', 'Fase D', 'Fase E', 'Fase F']

export default function ExamInfoForm({ data, onChange, onNext }: Props) {
  const API_URL = import.meta.env.VITE_API_URL
  const [classes, setClasses] = useState<any[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const { data: { session } } = await (await import('../../../../lib/supabaseClient')).supabase.auth.getSession()
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
    fetchTargets()
  }, [API_URL])

  const setField = (field: string, value: any) => onChange({ ...data, [field]: value })

  const toggleSubClass = (classGroupID: string, subClassID: string) => {
    const targets: Target[] = data.targets || []
    const exists = targets.find(
      (t) => t.class_group_id === classGroupID && t.class_sub_group_id === subClassID
    )
    let newTargets: Target[]
    if (exists) {
      newTargets = targets.filter(
        (t) => !(t.class_group_id === classGroupID && t.class_sub_group_id === subClassID)
      )
    } else {
      newTargets = [...targets, { class_group_id: classGroupID, class_sub_group_id: subClassID }]
    }
    setField('targets', newTargets)
  }

  const isSubClassSelected = (classGroupID: string, subClassID: string) => {
    return (data.targets || []).some(
      (t: Target) => t.class_group_id === classGroupID && t.class_sub_group_id === subClassID
    )
  }

  const canContinue =
    data.title?.trim() &&
    data.subject &&
    data.duration_minutes > 0 &&
    (data.targets || []).length > 0

  return (
    <div className="space-y-6 rounded-2xl border border-tp-border bg-white p-6">
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
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">
            Mata Pelajaran <span className="text-rose-500">*</span>
          </label>
          <select
            value={data.subject || ''}
            onChange={(e) => setField('subject', e.target.value)}
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          >
            <option value="">-- Pilih --</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">Tipe Ujian</label>
          <select
            value={data.exam_type || 'regular'}
            onChange={(e) => setField('exam_type', e.target.value)}
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          >
            {EXAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">Kelas</label>
          <input
            type="text"
            value={data.grade_level || ''}
            onChange={(e) => setField('grade_level', e.target.value)}
            placeholder="8"
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">Fase</label>
          <select
            value={data.phase || ''}
            onChange={(e) => setField('phase', e.target.value)}
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          >
            <option value="">-- Pilih --</option>
            {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">Durasi (menit) <span className="text-rose-500">*</span></label>
          <input
            type="number"
            min={1}
            value={data.duration_minutes || 60}
            onChange={(e) => setField('duration_minutes', parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">KKM</label>
          <input
            type="number"
            value={data.passing_score ?? 70}
            onChange={(e) => setField('passing_score', parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tp-text">Tahun Akademik</label>
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
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">Deskripsi</label>
        <textarea
          rows={3}
          value={data.description || ''}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Deskripsi singkat ujian (opsional)"
          className="w-full resize-none rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
        />
      </div>

      {/* Target Kelas */}
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
          <div className="py-4 text-center text-xs text-tp-muted">Memuat kelas...</div>
        ) : classes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-tp-border bg-white p-6 text-center">
            <p className="text-xs text-tp-muted">
              Belum ada kelas. Tambahkan kelas terlebih dahulu di menu <b>Kelola Kelas</b>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((c) => (
              <div key={c.class_group_id} className="rounded-xl border border-tp-border bg-white p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-tp-text">{c.class_group_name}</span>
                    <span className="ml-2 rounded-md bg-tp-green/10 px-2 py-0.5 text-[10px] font-semibold text-tp-green">
                      {c.level} • {c.class_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-tp-muted">{c.academic_year_name} • {c.semester}</span>
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
                        checked={isSubClassSelected(c.class_group_id, sub.id)}
                        onChange={() => toggleSubClass(c.class_group_id, sub.id)}
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