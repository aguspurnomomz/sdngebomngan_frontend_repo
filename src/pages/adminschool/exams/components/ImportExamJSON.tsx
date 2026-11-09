import { useRef, useState } from 'react'
import { Upload, FileJson, X, AlertCircle, Lock } from 'lucide-react'
import CryptoJS from 'crypto-js'

type ImportExamJSONProps = {
  onImport: (questions: any[], scoringConfig?: any) => void
}

export default function ImportExamJSON({ onImport }: ImportExamJSONProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State untuk menangani file terenkripsi
  const [encryptedData, setEncryptedData] = useState<string | null>(null)
  const [passwordInput, setPasswordInput] = useState('')

  const processParsedData = (parsed: any, scoringConfig: any = null) => {
    let questionsToImport = []
    let finalScoringConfig = scoringConfig

    if (Array.isArray(parsed)) {
      questionsToImport = parsed
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.questions)) {
        questionsToImport = parsed.questions
        if (parsed.scoring_config && !finalScoringConfig) {
          finalScoringConfig = parsed.scoring_config
        }
      } else {
        throw new Error('File JSON tidak memiliki properti "questions" yang valid.')
      }
    } else {
      throw new Error('Format JSON tidak dikenali.')
    }

    if (questionsToImport.length === 0) {
      throw new Error('Tidak ada soal yang ditemukan dalam file JSON.')
    }

    // Validasi struktur minimal
    questionsToImport.forEach((q: any, idx: number) => {
      if (!q.type || !['multiple_choice', 'essay'].includes(q.type)) {
        throw new Error(`Soal ke-${idx + 1} tidak memiliki "type" yang valid.`)
      }
      if (!q.question_text) {
        throw new Error(`Soal ke-${idx + 1} tidak memiliki "question_text".`)
      }
    })

    // Sanitasi & beri ID baru
    const sanitizedQuestions = questionsToImport.map((q: any, i: number) => ({
      ...q,
      id: crypto.randomUUID?.() || `q-import-${Date.now()}-${i}`,
      order: i + 1,
      score: Number(q.score) || 0,
      min_words: Number(q.min_words) || 0,
    }))

    onImport(sanitizedQuestions, finalScoringConfig)
    
    // Reset state
    setIsOpen(false)
    setEncryptedData(null)
    setPasswordInput('')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setError('Format file harus .json')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)

        // Deteksi apakah ini file terenkripsi
        if (parsed && parsed._encrypted === true && parsed._data) {
          setEncryptedData(parsed._data)
          setError(null)
          return // Tunggu user memasukkan password
        }

        // Jika tidak terenkripsi, proses langsung
        processParsedData(parsed)
        
      } catch (err: any) {
        setError(err.message || 'Gagal membaca file JSON.')
      }
      
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  const handleDecrypt = () => {
    if (!passwordInput) {
      setError('Kata sandi tidak boleh kosong.')
      return
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData!, passwordInput)
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8)

      if (!decryptedText) {
        throw new Error('Kata sandi salah atau file rusak.')
      }

      const parsed = JSON.parse(decryptedText)
      processParsedData(parsed)
      
    } catch (err: any) {
      setError('Kata sandi salah atau file tidak valid.')
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <Upload size={14} /> Import JSON
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
          <FileJson size={14} /> Import Soal via JSON
        </span>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setError(null)
            setEncryptedData(null)
            setPasswordInput('')
          }}
          className="text-blue-600 hover:bg-blue-100 rounded p-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* JIKA BELUM ADA FILE ATAU SEDANG UPLOAD */}
      {!encryptedData && (
        <>
          <p className="text-[10px] text-blue-700 leading-tight">
            Pilih file <code>.json</code> hasil export soal atau file berisi array soal.
          </p>
          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </>
      )}

      {/* JIKA FILE TERENKRIPSI (Minta Password) */}
      {encryptedData && (
        <div className="mt-1 flex flex-col gap-2 p-2 bg-white rounded-lg border border-blue-200">
          <p className="text-[10px] font-semibold text-blue-800 flex items-center gap-1">
            <Lock size={12} /> File terkunci. Masukkan kata sandi:
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Kata sandi file..."
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDecrypt()
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEncryptedData(null)
                setPasswordInput('')
                setError(null)
              }}
              className="flex-1 rounded bg-slate-100 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDecrypt}
              className="flex-1 rounded bg-blue-600 py-1 text-[10px] font-semibold text-white hover:bg-blue-700"
            >
              Buka Kunci
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1 text-[10px] text-rose-600 mt-1">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}