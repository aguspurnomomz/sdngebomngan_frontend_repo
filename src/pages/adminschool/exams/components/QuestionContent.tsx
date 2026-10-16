import { useEffect, useRef } from 'react'
import { renderMathInElement, sanitizeHtml } from '../../../../lib/renderMathInElement'

type Props = {
  html: string
  className?: string
}

export default function QuestionContent({ html, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Setelah HTML dirender ke DOM, scan & render KaTeX
    if (ref.current) {
      renderMathInElement(ref.current)
    }
  }, [html])

  if (!html) return null

  return (
    <div
      ref={ref}
      className={`prose prose-sm max-w-none text-tp-text ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}