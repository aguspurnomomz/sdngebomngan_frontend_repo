import { useMemo, useState } from 'react'
import {
  Copy, Check, Download, Printer, Link2, ExternalLink, Share2,
} from 'lucide-react'

type Props = {
  accessCode: string
  examTitle: string
  scheduleDate: string
  className?: string
}

export default function ExamAccessPanel({
  accessCode,
  examTitle,
  scheduleDate,
  className = '',
}: Props) {
  const [copiedType, setCopiedType] = useState<'link' | 'code' | null>(null)

  const examUrl = useMemo(() => {
    const baseUrl = window.location.origin
    return `${baseUrl}/school-exam?code=${accessCode}`
  }, [accessCode])

  // QR Code via api.qrserver.com 
  const qrImageUrl = useMemo(() => {
    const encoded = encodeURIComponent(examUrl)
    // Ukuran 300x300, error correction level M
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}&margin=10`
  }, [examUrl])


  const handleCopy = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    }
  }

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QR_${accessCode}_${examTitle.replace(/[^a-z0-9]/gi, '_')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Gagal download QR: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800')
    if (!printWindow) {
      alert('Popup diblokir. Izinkan popup untuk print QR.')
      return
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Ujian - ${examTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            text-align: center;
            padding: 40px 20px;
            margin: 0;
          }
          h1 { font-size: 22px; margin: 0 0 8px; color: #1e293b; }
          .date { color: #64748b; font-size: 14px; margin-bottom: 24px; }
          .qr { margin: 20px 0; }
          .qr img { width: 300px; height: 300px; }
          .code {
            display: inline-block;
            font-family: monospace;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            padding: 12px 24px;
            background: #f1f5f9;
            border-radius: 8px;
            margin: 20px 0;
            color: #0f172a;
          }
          .hint { color: #64748b; font-size: 13px; margin-top: 24px; line-height: 1.6; }
          .hint strong { color: #1e293b; }
        </style>
      </head>
      <body>
        <h1>${examTitle}</h1>
        <p class="date">${new Date(scheduleDate).toLocaleDateString('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })}</p>
        <div class="qr">
          <img src="${qrImageUrl}" alt="QR Code" />
        </div>
        <div class="code">${accessCode}</div>
        <p class="hint">
          <strong>Scan QR Code</strong> atau buka link:<br>
          <a href="${examUrl}" style="color: #10b981; word-break: break-all;">${examUrl}</a><br><br>
          Atau masukkan <strong>Kode Akses</strong> di halaman ujian.
        </p>
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: examTitle,
          text: `Akses Ujian: ${examTitle}`,
          url: examUrl,
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopy(examUrl, 'link')
    }
  }

  return (
    <div className={`rounded-2xl border border-tp-border bg-white ${className}`}>
      <div className="flex items-center gap-2 border-b border-tp-border px-5 py-3.5">
        <Link2 size={16} className="text-tp-green" />
        <h3 className="text-sm font-bold text-tp-text">Akses Siswa</h3>
        <span className="text-[11px] text-tp-muted">
          • Bagikan ke siswa lewat QR atau link
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-[auto_1fr]">
   
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border-2 border-dashed border-tp-border bg-slate-50 p-3">
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="h-[200px] w-[200px] rounded-lg"
              onError={(e) => {
                // Fallback kalau QR server down
                ;(e.target as HTMLImageElement).src =
                  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2394a3b8' font-size='14'%3EGagal load QR%3C/text%3E%3C/svg%3E`
              }}
            />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
            Scan untuk masuk
          </p>

          {/* QR Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1 rounded-lg border border-tp-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-tp-muted hover:bg-slate-50"
              title="Download QR"
            >
              <Download size={11} /> PNG
            </button>
            <button
              type="button"
              onClick={handlePrintQR}
              className="inline-flex items-center gap-1 rounded-lg border border-tp-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-tp-muted hover:bg-slate-50"
              title="Print QR"
            >
              <Printer size={11} /> Print
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {/* Link */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-tp-text">
              Link Ujian
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border border-tp-border bg-slate-50 px-3 py-2 font-mono text-[11px] text-tp-muted">
                {examUrl}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(examUrl, 'link')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition ${
                  copiedType === 'link'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-tp-border bg-white text-tp-muted hover:bg-slate-50'
                }`}
              >
                {copiedType === 'link' ? (
                  <>
                    <Check size={12} /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
              <a
                href={examUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-tp-border bg-white text-tp-muted hover:bg-slate-50"
                title="Buka link"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Access Code */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-tp-text">
              Kode Akses (manual input)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-tp-border bg-slate-50 px-3 py-2">
                <code className="font-mono text-sm font-bold tracking-wider text-tp-text">
                  {accessCode}
                </code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accessCode, 'code')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition ${
                  copiedType === 'code'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-tp-border bg-white text-tp-muted hover:bg-slate-50'
                }`}
              >
                {copiedType === 'code' ? (
                  <>
                    <Check size={12} /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share button (mobile-friendly) */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover sm:w-auto"
          >
            <Share2 size={13} /> Bagikan Link
          </button>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 text-[11px] text-blue-700">
            <p className="mb-1 font-semibold">💡 Cara siswa akses:</p>
            <ul className="space-y-0.5">
              <li>• <b>Scan QR</b> pakai kamera HP → otomatis buka halaman ujian</li>
              <li>• Atau <b>buka link</b> di browser → isi NISN, Nama, Kode Akses</li>
              <li>• Atau <b>ketik manual</b> di halaman ujian: <code className="font-mono">{window.location.origin}/school-exam</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}