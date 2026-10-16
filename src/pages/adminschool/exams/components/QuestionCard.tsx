import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react'
import MCQEditor from './MCQEditor'
import EssayEditor from './EssayEditor'
import { getImageUrl } from './imageUploadHelper'

type Props = {
  question: any
  index: number
  onChange: (q: any) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export default function QuestionCard({
  question, index, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const isMCQ = question.type === 'multiple_choice'

  return (
    <div className="rounded-2xl border border-tp-border bg-white p-5 transition hover:border-tp-green/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GripVertical size={16} className="cursor-move text-slate-300" />
          <span className="text-sm font-bold text-tp-text">Soal #{index + 1}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
              isMCQ
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isMCQ ? 'PG' : 'Essay'}
          </span>

          {/* Preview thumbnail gambar soal */}
          {question.image_url && (
            <div className="relative">
              <img
                src={getImageUrl(question.image_url)}
                alt=""
                className="h-7 w-7 rounded-md border border-tp-border object-cover"
                title="Soal ini memiliki gambar"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
              <ImageIcon
                size={14}
                className="pointer-events-none absolute -bottom-0.5 -right-0.5 rounded-sm bg-white p-[1px] text-tp-green"
              />
            </div>
          )}

          {question.score > 0 && (
            <span className="text-[11px] text-tp-muted">{question.score} poin</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="grid h-8 w-8 place-items-center rounded-lg text-tp-muted hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="grid h-8 w-8 place-items-center rounded-lg text-tp-muted hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden h-8 items-center rounded-lg px-2 text-[11px] font-medium text-tp-muted hover:bg-slate-100 sm:flex"
          >
            {collapsed ? 'Perluas' : 'Ringkas'}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        isMCQ ? (
          <MCQEditor question={question} onChange={onChange} />
        ) : (
          <EssayEditor question={question} onChange={onChange} />
        )
      )}
    </div>
  )
}