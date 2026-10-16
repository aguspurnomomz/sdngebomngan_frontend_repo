import { AlertTriangle, Coins, Loader2, X } from 'lucide-react'
import type { ExamCostPreview } from '../types'

type Props = {
  open: boolean
  cost: ExamCostPreview | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function ConfirmPublishModal({
  open, cost, onClose, onConfirm, loading,
}: Props) {
  if (!open || !cost) return null

  const isFree = cost.total_cost === 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={() => !loading && onClose()}
          disabled={loading}
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-lg text-tp-muted hover:bg-slate-100 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          {isFree ? (
            <Coins className="h-7 w-7 text-amber-600" />
          ) : (
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-lg font-bold text-tp-text">
          {isFree ? 'Publish Ujian?' : 'Konfirmasi Publish'}
        </h3>

        {/* Body */}
        <div className="mb-6 text-center text-sm text-tp-muted">
          {isFree ? (
            <p>
              Ujian ini <strong className="text-tp-green">gratis</strong> untuk
              dipublish (ditanggung sekolah). Lanjutkan?
            </p>
          ) : (
            <>
              <p className="mb-3">
                Setelah publish, token akan{' '}
                <strong className="text-rose-600">langsung terpotong</strong>{' '}
                dan tidak bisa di-refund.
              </p>

              <div className="rounded-xl border border-tp-border bg-slate-50 p-4 text-left space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-tp-muted">Base publish:</span>
                  <span className="font-mono font-semibold text-tp-text">
                    {cost.base_cost} token
                  </span>
                </div>

                {cost.manual_extra_cost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-tp-muted">
                      Extra manual ({cost.breakdown.manual_extra_multiplier}×):
                    </span>
                    <span className="font-mono font-semibold text-tp-text">
                      {cost.manual_extra_cost} token
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-tp-border pt-1.5 mt-1.5 text-sm">
                  <span className="font-semibold text-tp-text">Total:</span>
                  <span className="font-mono font-bold text-rose-600">
                    -{cost.total_cost} token
                  </span>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-tp-muted">Saldo sekarang:</span>
                  <span className="font-mono text-tp-text">
                    {cost.current_balance} token
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-tp-muted">Saldo setelah:</span>
                  <span className="font-mono font-semibold text-tp-green">
                    {cost.current_balance - cost.total_cost} token
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </span>
            ) : isFree ? (
              'Ya, Publish'
            ) : (
              `Bayar ${cost.total_cost} Token`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}