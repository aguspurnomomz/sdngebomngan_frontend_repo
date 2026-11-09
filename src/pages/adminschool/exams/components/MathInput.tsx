import { useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

type Props = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export default function MathInput({ value, onChange, placeholder, className }: Props) {
  const [isFocused, setIsFocused] = useState(false)

  const renderTextWithMath = (text: string) => {
    if (!text) return null
    
    const parts = text.split(/(\$[^$]+\$)/g)
    
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        try {
          const latex = part.slice(1, -1)
          const html = katex.renderToString(latex, { throwOnError: false })
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        } catch (e) {
          return <span key={i}>{part}</span>
        }
      }
      return <span key={i}>{part}</span>
    })
  }

  if (isFocused || !value) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  return (
    <div
      onClick={() => setIsFocused(true)}
      className={`${className} cursor-text min-h-[38px] flex items-center px-3 bg-slate-50`}
      title="Klik untuk mengedit"
    >
      <div className="text-sm text-tp-text pointer-events-none w-full truncate">
        {renderTextWithMath(value)}
      </div>
    </div>
  )
}