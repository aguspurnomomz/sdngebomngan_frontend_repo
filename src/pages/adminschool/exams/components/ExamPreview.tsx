import { Save, Rocket } from 'lucide-react'

type Props = {
  data: any
  onBack: () => void
  onSaveDraft: () => void
  onPublish: () => void
  submitting: boolean
  readOnly?: boolean   
}

const SUBJECT_LABELS: Record<string, string> = {
  regular: 'Ulangan Harian', quiz: 'Quiz', uts: 'UTS', uas: 'UAS',
  tryout: 'Try Out', remedial: 'Remedial',
}

export default function ExamPreview({ data, onBack, onSaveDraft, onPublish, submitting, readOnly = false, }: Props) {
  const questions = data.questions || []
  const totalScore = questions.reduce((s: number, q: any) => s + (q.score || 0), 0)

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="rounded-2xl border border-tp-border bg-white p-6">
        <h2 className="mb-2 text-lg font-bold text-tp-text">{data.title}</h2>
        <div className="flex flex-wrap gap-2 text-[11px] text-tp-muted">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">{data.subject}</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">
            {SUBJECT_LABELS[data.exam_type] || data.exam_type}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">{data.duration_minutes} menit</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">KKM {data.passing_score}</span>
          <span className="rounded-md bg-tp-green/10 px-2 py-1 font-semibold text-tp-green">
            {data.targets?.length || 0} sub kelas
          </span>
        </div>
        {data.description && (
          <p className="mt-3 text-xs text-tp-muted">{data.description}</p>
        )}
      </div>

      {/* Ringkasan soal */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-tp-border bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-tp-muted">Total Soal</p>
          <p className="mt-1 text-2xl font-bold text-tp-text">{questions.length}</p>
        </div>
        <div className="rounded-2xl border border-tp-border bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-tp-muted">Total Poin</p>
          <p className="mt-1 text-2xl font-bold text-tp-green">{totalScore}</p>
        </div>
        <div className="rounded-2xl border border-tp-border bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-tp-muted">Komposisi</p>
          <p className="mt-1 text-xs font-semibold text-tp-text">
            {questions.filter((q: any) => q.type === 'multiple_choice').length} PG
            {' • '}
            {questions.filter((q: any) => q.type === 'essay').length} Essay
          </p>
        </div>
      </div>

      {/* Preview soal */}
      <div className="rounded-2xl border border-tp-border bg-white p-6">
        <h3 className="mb-4 text-sm font-bold text-tp-text">Preview Soal</h3>
        <div className="space-y-4">
          {questions.map((q: any, i: number) => (
            <div key={q.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-tp-muted">#{i + 1}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    q.type === 'multiple_choice'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {q.type === 'multiple_choice' ? 'PG' : 'Essay'}
                </span>
                <span className="text-[11px] text-tp-muted">{q.score} poin</span>
              </div>
              <p className="mb-2 text-sm text-tp-text">{q.question_text}</p>
              {q.type === 'multiple_choice' && q.options && (
                <div className="grid grid-cols-2 gap-1.5 text-xs text-tp-muted">
                  {Object.entries(q.options).map(([k, v]) => (
                    <div
                      key={k}
                      className={`rounded-md px-2 py-1 ${
                        q.correct_answer === k
                          ? 'bg-tp-green/10 font-semibold text-tp-green'
                          : 'bg-white'
                      }`}
                    >
                      {k}. {v as string} {q.correct_answer === k && '✓'}
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'essay' && q.answer_key && (
                <div className="rounded-md bg-white p-2 text-[11px] text-tp-muted">
                  <span className="font-semibold">Kunci:</span> {q.answer_key}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-xl border border-tp-border bg-white px-5 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50"
          >
            ← Kembali
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-tp-green bg-white px-5 py-2.5 text-sm font-semibold text-tp-green hover:bg-tp-green/5 disabled:opacity-50"
            >
              <Save size={14} /> {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
            >
              <Rocket size={14} /> {submitting ? 'Memproses...' : 'Simpan & Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}