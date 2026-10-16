import { Copy, RefreshCw, Trash2, Check, ExternalLink } from 'lucide-react'
import type { ExamParticipant } from '../types'

type Props = {
  participant: ExamParticipant
  onCopyCode: (code: string) => void
  onCopyLink: (link: string) => void
  onRegenerate: (id: string) => void
  onRemove: (id: string) => void
  isCopied: 'code' | 'link' | null
  loadingAction: string | null
}

export function ParticipantRow({
  participant, onCopyCode, onCopyLink, onRegenerate, onRemove,
  isCopied, loadingAction,
}: Props) {
  const statusStyles: Record<string, string> = {
    not_started: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    submitted: 'bg-amber-100 text-amber-700',
    graded: 'bg-emerald-100 text-emerald-700',
    graded_with_pending: 'bg-purple-100 text-purple-700',
  }

  const statusLabels: Record<string, string> = {
    not_started: 'Belum Mulai',
    in_progress: 'Sedang Mengerjakan',
    submitted: 'Sudah Submit',
    graded: 'Sudah Dinilai',
    graded_with_pending: 'Menunggu Essay',
  }

  const status = participant.submission_status || 'not_started'
  const hasSubmitted = status !== 'not_started'
  const canRemove = !hasSubmitted

  return (
    <div className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-slate-50 transition">
      {/* Student info */}
      <div className="col-span-4 min-w-0">
        <p className="text-sm font-semibold text-tp-text truncate">
          {participant.full_name}
        </p>
        <p className="text-[11px] text-tp-muted truncate">
          {participant.nisn && `NISN: ${participant.nisn}`}
          {participant.nisn && participant.student_number && ' • '}
          {participant.student_number && `No: ${participant.student_number}`}
        </p>
      </div>

      {/* Access code */}
      <div className="col-span-3">
        {participant.access_code ? (
          <div className="flex items-center gap-1.5">
            <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-tp-text tracking-wider">
              {participant.access_code}
            </code>
            <button
              type="button"
              onClick={() => onCopyCode(participant.access_code!)}
              className="grid h-6 w-6 place-items-center rounded text-tp-muted hover:bg-slate-200"
              title="Copy code"
            >
              {isCopied === 'code' ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        ) : (
          <span className="text-[11px] italic text-tp-faint">Belum ada kode</span>
        )}
      </div>

      {/* Status */}
      <div className="col-span-2">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            statusStyles[status] || statusStyles.not_started
          }`}
        >
          {statusLabels[status] || status}
        </span>
       {typeof participant.percentage === 'number' && (
        <p className="text-[10px] text-tp-muted mt-0.5 font-mono">
            {participant.percentage.toFixed(1)}%
        </p>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-3 flex items-center justify-end gap-1">
        {participant.exam_url && (
          <>
            <button
              type="button"
              onClick={() => onCopyLink(participant.exam_url!)}
              className="grid h-7 w-7 place-items-center rounded-lg text-tp-muted hover:bg-slate-200"
              title="Copy link"
            >
              {isCopied === 'link' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={participant.exam_url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-7 w-7 place-items-center rounded-lg text-tp-muted hover:bg-slate-200"
              title="Buka link"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}

        {participant.access_code && !hasSubmitted && (
          <button
            type="button"
            onClick={() => onRegenerate(participant.id)}
            disabled={loadingAction === `regen-${participant.id}`}
            className="grid h-7 w-7 place-items-center rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-50"
            title="Regenerate kode"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loadingAction === `regen-${participant.id}` ? 'animate-spin' : ''
              }`}
            />
          </button>
        )}

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(participant.id)}
            disabled={loadingAction === `remove-${participant.id}`}
            className="grid h-7 w-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50"
            title="Hapus dari ujian"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}