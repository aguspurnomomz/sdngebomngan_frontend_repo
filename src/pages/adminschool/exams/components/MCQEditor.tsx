import { Trash2, Plus } from 'lucide-react'
import ImageUploader from './ImageUploader'
import RichTextEditor from './RichTextEditor'

type Props = {
  question: any
  onChange: (q: any) => void
}

export default function MCQEditor({ question, onChange }: Props) {
  const options = question.options || { A: '', B: '', C: '', D: '' }
  const setField = (k: string, v: any) => onChange({ ...question, [k]: v })

  const setOption = (key: string, value: string) => {
    onChange({ ...question, options: { ...options, [key]: value } })
  }

  const removeOption = (key: string) => {
    const next = { ...options }
    delete next[key]
    onChange({ ...question, options: next })
  }

  const addOption = () => {
    const keys = Object.keys(options)
    const next = String.fromCharCode(65 + keys.length) // E, F, ...
    onChange({ ...question, options: { ...options, [next]: '' } })
  }

  return (
    <div className="space-y-4">
      {/* Pertanyaan */}
      {/* <div>
        <label className="mb-1.5 block text-xs font-semibold text-tp-text">
          Pertanyaan <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={2}
          value={question.question_text || ''}
          onChange={(e) => setField('question_text', e.target.value)}
          placeholder="Tulis pertanyaan..."
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
          placeholder="Tulis pertanyaan..."
        />
      </div>

      <ImageUploader
        value={question.image_url || ''}
        onChange={(objectKey) => setField('image_url', objectKey)}
      />

      {/* Opsi */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-tp-text">Pilihan Jawaban</label>
        <div className="space-y-2">
          {Object.entries(options).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correct_answer === key}
                onChange={() => setField('correct_answer', key)}
                className="h-4 w-4 accent-tp-green"
                title="Tandai sebagai kunci jawaban"
              />
              <span className="w-6 shrink-0 text-xs font-bold text-tp-muted">{key}.</span>
              <input
                type="text"
                value={val as string}
                onChange={(e) => setOption(key, e.target.value)}
                placeholder={`Opsi ${key}`}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  question.correct_answer === key
                    ? 'border-tp-green bg-tp-green/5 font-medium'
                    : 'border-tp-border'
                }`}
              />
              {Object.keys(options).length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(key)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {Object.keys(options).length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-tp-border px-3 py-1.5 text-[11px] font-medium text-tp-muted hover:border-tp-green hover:text-tp-green"
          >
            <Plus size={12} /> Tambah Opsi
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-tp-muted">Skor</label>
          <input
            type="number"
            value={question.score ?? 1}
            onChange={(e) => setField('score', parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-tp-muted">Level Kognitif</label>
          <select
            value={question.cognitive_level || ''}
            onChange={(e) => setField('cognitive_level', e.target.value)}
            className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
          >
            <option value="">-- Pilih --</option>
            {['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pembahasan */}
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-tp-muted">Pembahasan (opsional)</label>
        <textarea
          rows={2}
          value={question.explanation || ''}
          onChange={(e) => setField('explanation', e.target.value)}
          className="w-full resize-none rounded-lg border border-tp-border px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}