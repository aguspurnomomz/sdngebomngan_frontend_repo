import { AlertTriangle, Coins, Info } from 'lucide-react'
import type { ExamCostPreview as CostPreviewType } from '../types'

type Props = {
  cost: CostPreviewType | null
  loading?: boolean
  compact?: boolean
}

export function ExamCostPreview({ cost, loading, compact = false }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-tp-border bg-slate-50 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
    )
  }

  if (!cost) return null

  const isFree = cost.total_cost === 0
  const sufficient = cost.sufficient


  if (isFree) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              Gratis (ditanggung sekolah)
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Ujian ini tidak memerlukan token untuk dipublish.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        sufficient
          ? 'border-blue-200 bg-blue-50'
          : 'border-rose-200 bg-rose-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <Coins
          className={`h-5 w-5 shrink-0 mt-0.5 ${
            sufficient ? 'text-blue-600' : 'text-rose-600'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              sufficient ? 'text-blue-900' : 'text-rose-900'
            }`}
          >
            Biaya Publish: {cost.total_cost} token
          </p>

          {!compact && (
            <div className="mt-2 space-y-1 text-[11px]">
              <div
                className={`flex justify-between ${
                  sufficient ? 'text-blue-700' : 'text-rose-700'
                }`}
              >
                <span>Base publish:</span>
                <span className="font-mono">{cost.base_cost} token</span>
              </div>

              {cost.manual_extra_cost > 0 && (
                <div
                  className={`flex justify-between ${
                    sufficient ? 'text-blue-700' : 'text-rose-700'
                  }`}
                >
                  <span>
                    Extra manual (&gt;25 soal ×{' '}
                    {cost.breakdown.manual_extra_multiplier}):
                  </span>
                  <span className="font-mono">
                    {cost.manual_extra_cost} token
                  </span>
                </div>
              )}

              <div
                className={`flex justify-between border-t pt-1 mt-1 ${
                  sufficient
                    ? 'border-blue-200 text-blue-800'
                    : 'border-rose-200 text-rose-800'
                }`}
              >
                <span className="font-semibold">Saldo Anda:</span>
                <span className="font-mono font-semibold">
                  {cost.current_balance} token
                </span>
              </div>
            </div>
          )}

          {!sufficient && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-rose-100 p-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700">
                Token tidak cukup. Butuh{' '}
                <strong>{cost.total_cost - cost.current_balance}</strong> token
                lagi. Silakan topup dulu.
              </p>
            </div>
          )}

          {sufficient && compact && (
            <p className="text-[11px] text-blue-700 mt-1">
              Saldo Anda: {cost.current_balance} token (cukup ✓)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}