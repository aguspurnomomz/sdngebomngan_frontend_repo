import { Trash2, Plus } from 'lucide-react'
import ImageUploader from './ImageUploader'
import RichTextEditor from './RichTextEditor'

type Props = {
  question: any
  onChange: (q: any) => void
}

export default function EssayEditor({ question, onChange }: Props) {
  const rubric = question.rubric || []
  const setField = (k: string, v: any) => onChange({ ...question, [k]: v })

  const setRubricItem = (idx: number, key: string, val: any) => {
    const next = [...rubric]
    next[idx] = { ...next[idx], [key]: val }
    setField('rubric', next)
  }

  const addRubric = () => setField('rubric', [...rubric, { criteria: '', score: 1 }])
  const removeRubric = (idx: number) => setField('rubric', rubric.filter((_: any, i: number) => i !== idx))

  return (
    <div className="space-y-4">
      {/* <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">
          Pertanyaan <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          value={question.question_text || ''}
          onChange={(e) => setField('question_text', e.target.value)}
          placeholder="Tulis pertanyaan essay..."
          className="w-full resize-none rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
        />
      </div> */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">
          Pertanyaan <span className="text-rose-500">*</span>
        </label>
        <RichTextEditor
          value={question.question_text || ''}
          onChange={(html) => setField('question_text', html)}
          placeholder="Tulis pertanyaan essay..."
        />
      </div>


      {/* Soal Gambar  */}
      <ImageUploader
        value={question.image_url || ''}
        onChange={(objectKey) => setField('image_url', objectKey)}
      />

      {/* <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">Kunci Jawaban / Patokan</label>
        <textarea
          rows={3}
          value={question.answer_key || ''}
          onChange={(e) => setField('answer_key', e.target.value)}
          placeholder="Patokan jawaban untuk koreksi manual"
          className="w-full resize-none rounded-xl border border-tp-border px-3.5 py-2.5 text-sm focus:border-tp-green focus:outline-none"
        />
      </div> */}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">
          Kunci Jawaban / Patokan
        </label>
        <RichTextEditor
          value={question.answer_key || ''}
          onChange={(html) => setField('answer_key', html)}
          placeholder="Patokan jawaban untuk koreksi manual"
        />
      </div>

      {/* Rubrik */}
      <div className="rounded-xl border border-tp-border bg-slate-50/50 p-4">
        <label className="mb-2 block text-xs font-semibold text-tp-text">
          Rubrik Penilaian (opsional)
        </label>
        <div className="space-y-2">
          {rubric.map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={r.criteria || ''}
                onChange={(e) => setRubricItem(i, 'criteria', e.target.value)}
                placeholder="Kriteria penilaian..."
                className="flex-1 rounded-lg border border-tp-border px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={r.score ?? 1}
                onChange={(e) => setRubricItem(i, 'score', parseFloat(e.target.value) || 0)}
                className="w-20 rounded-lg border border-tp-border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeRubric(i)}
                className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRubric}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-tp-border px-3 py-1.5 text-[11px] font-medium text-tp-muted hover:border-tp-green hover:text-tp-green"
        >
          <Plus size={12} /> Tambah Kriteria
        </button>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-tp-muted">Skor</label>
          <input
            type="number"
            value={question.score ?? 5}
            onChange={(e) => setField('score', parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-tp-muted">Min. Kata</label>
          <input
            type="number"
            value={question.min_words ?? 0}
            onChange={(e) => setField('min_words', parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-tp-muted">Level</label>
          <select
            value={question.cognitive_level || ''}
            onChange={(e) => setField('cognitive_level', e.target.value)}
            className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
          >
            <option value="">--</option>
            {['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}