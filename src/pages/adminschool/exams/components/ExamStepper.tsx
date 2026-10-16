import { Check } from 'lucide-react'

type Props = {
  current: number 
  steps?: string[]
}

export default function ExamStepper({ current, steps = ['Info Ujian', 'Daftar Soal', 'Preview & Publish'] }: Props) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((label, i) => {
        const num = i + 1
        const isActive = num === current
        const isDone = num < current
        return (
          <div key={num} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${
                  isDone
                    ? 'bg-tp-green text-white'
                    : isActive
                    ? 'bg-tp-green text-white ring-4 ring-tp-green/20'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? <Check size={14} /> : num}
              </div>
              <span
                className={`hidden text-xs font-semibold sm:block ${
                  isActive ? 'text-tp-text' : 'text-tp-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] w-8 rounded-full sm:w-12 ${isDone ? 'bg-tp-green' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}