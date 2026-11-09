import { Save, Rocket } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

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

// Helper 1: Render teks opsi jawaban yang mungkin mengandung $...$
function renderMathText(text: string) {
  if (!text) return null
  const parts = text.split(/(\$[^$]+\$)/g)
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
      try {
        const html = katex.renderToString(part.slice(1, -1), { throwOnError: false })
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
      } catch {
        return <span key={i}>{part}</span>
      }
    }
    return <span key={i}>{part}</span>
  })
}

// Helper 2: Render HTML dari RichTextEditor dengan DOMParser (Jauh lebih aman!)
function renderHtmlWithMath(html: string) {
  if (!html) return null
  
  // Jika di lingkungan server-side (SSR) atau tidak ada DOMParser, fallback
  if (typeof window === 'undefined') {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  // 1. Parsing string HTML menjadi DOM object
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 2. Cari semua elemen yang merupakan inline-math
  // Menggunakan querySelectorAll agar tidak peduli class atau atribut apa pun yang ditambahkan Tiptap
  const mathNodes = doc.querySelectorAll('[data-type="inline-math"]')
  
  mathNodes.forEach((node) => {
    // Ambil LaTeX dari atribut, atau jika tidak ada, coba dari dalam teks elemen
    const latex = node.getAttribute('data-latex') || node.textContent || ''
    
    if (latex) {
      try {
        // Render LaTeX ke string HTML menggunakan KaTeX
        const renderedMath = katex.renderToString(latex, { 
          throwOnError: false, 
          output: 'html' 
        })
        // Ganti elemen span tadi dengan HTML KaTeX yang baru
        node.outerHTML = renderedMath
      } catch (e) {
        node.outerHTML = `<span class="text-rose-500">[Math Error]</span>`
      }
    }
  })

  // 3. Ubah kembali DOM yang sudah diedit menjadi string HTML utuh
  const finalHtml = doc.body.innerHTML

  return (
    <div 
      className="prose prose-sm max-w-none text-tp-text" 
      dangerouslySetInnerHTML={{ __html: finalHtml }} 
    />
  )
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
            <div key={q.id || i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
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

              {/* Pertanyaan */}
              <div className="mb-3 text-sm text-tp-text">
                {renderHtmlWithMath(q.question_text)}
              </div>

              {/* Pilihan Jawaban */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="grid grid-cols-2 gap-1.5 text-xs text-tp-muted mb-3">
                  {Object.entries(q.options).map(([k, v]) => (
                    <div
                      key={k}
                      className={`rounded-md px-2 py-1.5 ${
                        q.correct_answer === k
                          ? 'bg-tp-green/10 font-semibold text-tp-green'
                          : 'bg-white'
                      }`}
                    >
                      <span className="font-bold">{k}.</span> {renderMathText(v as string)} {q.correct_answer === k && '✓'}
                    </div>
                  ))}
                </div>
              )}

              {/* Pembahasan */}
              {q.explanation && (
                <div className="mt-2 rounded-md bg-white p-3 text-[11px] text-tp-muted border border-slate-100">
                  <span className="font-semibold block mb-1">Pembahasan:</span>
                  <div>{renderHtmlWithMath(q.explanation)}</div>
                </div>
              )}

              {/* Kunci Jawaban Essay */}
              {q.type === 'essay' && q.answer_key && (
                <div className="mt-2 rounded-md bg-white p-3 text-[11px] text-tp-muted border border-slate-100">
                  <span className="font-semibold block mb-1">Kunci Jawaban:</span>
                  <div>{renderHtmlWithMath(q.answer_key)}</div>
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