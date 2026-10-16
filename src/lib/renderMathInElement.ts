import katex from 'katex'

/**
 * Scan semua elemen `.math-inline` di dalam container,
 * dan replace innerHTML-nya dengan KaTeX render.
 * 
 * Dipakai setelah `dangerouslySetInnerHTML` untuk render HTML soal,
 * supaya rumus LaTeX jadi cantik.
 */
export function renderMathInElement(container: HTMLElement | null) {
  if (!container) return

  const mathElements = container.querySelectorAll<HTMLElement>('.math-inline')

  mathElements.forEach((el) => {
    // Skip kalau sudah pernah dirender
    if (el.dataset.rendered === 'true') return

    const latexEncoded = el.dataset.latex
    if (!latexEncoded) return

    let latex: string
    try {
      latex = decodeURIComponent(latexEncoded)
    } catch {
      latex = latexEncoded
    }

    try {
      katex.render(latex, el, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
      })
      el.dataset.rendered = 'true'
    } catch (e) {
      console.error('[renderMathInElement] Gagal render LaTeX:', latex, e)
      // Biarkan fallback $latex$ asli
    }
  })
}

/**
 * Helper: sanitize HTML sederhana di frontend.
 * Strip tag berbahaya seperti <script>, on* attributes, dll.
 * 
 * Ini hanya layer kedua. Tetap wajib sanitize di backend (Fase 2.2)!
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Strip <script>, <iframe>, <object>, <embed>
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')

  // Strip event handler attributes (onclick, onerror, dll)
  cleaned = cleaned.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  cleaned = cleaned.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  cleaned = cleaned.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')

  // Strip javascript: URLs
  cleaned = cleaned.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
  cleaned = cleaned.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'")

  return cleaned
}