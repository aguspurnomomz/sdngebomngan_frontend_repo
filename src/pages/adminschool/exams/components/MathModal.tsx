import { useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import { X, Check, AlertCircle } from 'lucide-react'

type Props = {
  open: boolean
  initialLatex?: string
  onClose: () => void
  onInsert: (latex: string) => void
}

const SAMPLE_SNIPPETS = [
  { label: 'Pecahan', latex: '\\frac{a}{b}' },
  { label: 'Akar', latex: '\\sqrt{x}' },
  { label: 'Pangkat', latex: 'x^{2}' },
  { label: 'Sigma', latex: '\\sum_{i=1}^{n} i' },
  { label: 'Integral', latex: '\\int_{0}^{\\infty} e^{-x^2} dx' },
  { label: 'Limit', latex: '\\lim_{x \\to \\infty} \\frac{1}{x}' },
  { label: 'Matriks', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Pi', latex: '\\pi' },
]

export default function MathModal({ open, initialLatex = '', onClose, onInsert }: Props) {
  const [latex, setLatex] = useState(initialLatex)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)


  useEffect(() => {
    if (open) {
      setLatex(initialLatex)
      setError(null)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open, initialLatex])


  const previewHtml = useMemo(() => {
    if (!latex.trim()) return ''
    try {
      return katex.renderToString(latex, {
        displayMode: false,
        throwOnError: true,
        output: 'html',
      })
    } catch (e: any) {
      return ''
    }
  }, [latex])

  useEffect(() => {
    if (!latex.trim()) {
      setError(null)
      return
    }
    try {
      katex.renderToString(latex, { throwOnError: true })
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Rumus tidak valid')
    }
  }, [latex])


  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleInsert = () => {
    if (!latex.trim()) {
      setError('Rumus tidak boleh kosong')
      return
    }
    if (error) return
    onInsert(latex)
    onClose()
  }

  const handleSnippetClick = (snippet: string) => {
    setLatex(snippet)
    textareaRef.current?.focus()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tp-border px-5 py-3.5">
          <h3 className="text-sm font-bold text-tp-text">Sisipkan Rumus Matematika</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-tp-muted hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Snippet shortcuts */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-tp-muted">
              Template Cepat
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_SNIPPETS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSnippetClick(s.latex)}
                  className="rounded-lg border border-tp-border bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-tp-text transition hover:border-tp-green hover:bg-tp-green/5 hover:text-tp-green"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* LaTeX input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-tp-text">
              Kode LaTeX
            </label>
            <textarea
              ref={textareaRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="Contoh: \\frac{a}{b} atau \\sqrt{x^2 + y^2}"
              rows={4}
              className="w-full resize-none rounded-xl border border-tp-border px-3.5 py-2.5 font-mono text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20"
            />
            {error && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-600">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-tp-text">
              Preview
            </label>
            <div className="min-h-[80px] rounded-xl border border-tp-border bg-slate-50 p-4">
              {previewHtml ? (
                <div
                  className="overflow-x-auto text-lg"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-xs italic text-tp-muted">
                  Preview akan muncul di sini...
                </p>
              )}
            </div>
          </div>

          {/* Hint */}
          <div className="rounded-xl bg-blue-50 p-3 text-[11px] text-blue-700">
            <p className="mb-1 font-semibold">💡 Tips:</p>
            <ul className="space-y-0.5">
              <li>• Gunakan <code className="rounded bg-white px-1 font-mono">\\frac{'{'}a{'}'}{'{'}b{'}'}</code> untuk pecahan</li>
              <li>• Gunakan <code className="rounded bg-white px-1 font-mono">x^{'{'}2{'}'}</code> untuk pangkat, <code className="rounded bg-white px-1 font-mono">x_{'{'}i{'}'}</code> untuk index bawah</li>
              <li>• Simbol Yunani: <code className="rounded bg-white px-1 font-mono">\\alpha</code>, <code className="rounded bg-white px-1 font-mono">\\beta</code>, <code className="rounded bg-white px-1 font-mono">\\pi</code></li>
              <li>• Cek dokumentasi lengkap di <a href="https://katex.org/docs/supported" target="_blank" rel="noopener noreferrer" className="underline">katex.org/docs/supported</a></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-tp-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!!error || !latex.trim()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-tp-green-hover disabled:opacity-40"
          >
            <Check size={14} /> Sisipkan Rumus
          </button>
        </div>
      </div>
    </div>
  )
}