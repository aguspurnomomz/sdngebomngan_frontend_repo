import { Plus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid' // npm i uuid
import QuestionCard from './QuestionCard'

type Props = {
  data: any
  onChange: (data: any) => void
  onBack: () => void
  onNext: () => void
}

export default function ExamQuestionBuilder({ data, onChange, onBack, onNext }: Props) {
  const questions = data.questions || []

  const addQuestion = (type: 'multiple_choice' | 'essay') => {
    const newQ = type === 'multiple_choice'
      ? {
          id: uuidv4(),
          type: 'multiple_choice',
          order: questions.length + 1,
          question_text: '',
          options: { A: '', B: '', C: '', D: '' },
          correct_answer: 'A',
          explanation: '',
          cognitive_level: 'C2',
          score: 1,
        }
      : {
          id: uuidv4(),
          type: 'essay',
          order: questions.length + 1,
          question_text: '',
          answer_key: '',
          rubric: [],
          cognitive_level: 'C4',
          score: 5,
          min_words: 0,
        }
    onChange({ ...data, questions: [...questions, newQ] })
  }

  const updateQuestion = (idx: number, q: any) => {
    const next = [...questions]
    next[idx] = q
    onChange({ ...data, questions: next })
  }

  const removeQuestion = (idx: number) => {
    const next = questions.filter((_: any, i: number) => i !== idx)
    onChange({ ...data, questions: next })
  }

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    next.forEach((q, i) => (q.order = i + 1))
    onChange({ ...data, questions: next })
  }

  const totalMCQ = questions.filter((q: any) => q.type === 'multiple_choice').length
  const totalEssay = questions.filter((q: any) => q.type === 'essay').length
  const totalScore = questions.reduce((sum: number, q: any) => sum + (q.score || 0), 0)

  const canContinue = questions.length > 0 && questions.every((q: any) =>
    q.question_text?.trim() &&
    (q.type === 'multiple_choice'
      ? Object.values(q.options || {}).some((v) => (v as string).trim()) && q.correct_answer
      : true)
  )

  return (
    <div className="space-y-5">
      {/* Ringkasan */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-tp-border bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {totalMCQ} Pilihan Ganda
          </span>
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            {totalEssay} Essay
          </span>
          <span className="rounded-lg bg-tp-green/10 px-3 py-1.5 text-xs font-semibold text-tp-green">
            Total: {totalScore} poin
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => addQuestion('multiple_choice')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={14} /> Tambah PG
          </button>
          <button
            type="button"
            onClick={() => addQuestion('essay')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
          >
            <Plus size={14} /> Tambah Essay
          </button>
        </div>
      </div>

      {/* List soal */}
      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tp-border bg-white p-12 text-center">
          <p className="mb-1 text-sm font-semibold text-tp-text">Belum ada soal</p>
          <p className="text-xs text-tp-muted">
            Klik tombol "Tambah PG" atau "Tambah Essay" di atas untuk mulai membuat soal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q: any, i: number) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              onChange={(updated) => updateQuestion(i, updated)}
              onRemove={() => removeQuestion(i)}
              onMoveUp={() => moveQuestion(i, -1)}
              onMoveDown={() => moveQuestion(i, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < questions.length - 1}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-tp-border bg-white px-5 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50"
        >
          ← Kembali
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className="rounded-xl bg-tp-green px-6 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Preview & Publish →
        </button>
      </div>
    </div>
  )
}