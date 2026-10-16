import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Loader2, AlertCircle} from 'lucide-react'
import { examParticipantApi } from '../api'
import { useAuthToken } from '@/features/hooks/useAuthToken'
import type { QRSheetResponse } from '../types'

export default function PersonalExamQrSheetPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const { token } = useAuthToken()

  const [sheet, setSheet] = useState<QRSheetResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (!token || !examId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await examParticipantApi.qrSheet(token, examId)
        if (!cancelled) setSheet(data)
      } catch (e: any) {
        if (!cancelled) {
          setError(e.response?.data?.error || e.message || 'Gagal memuat data')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    return () => { cancelled = true }
  }, [token, examId])

 
  const handlePrint = () => {
    window.print()
  }


  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-tp-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (error || !sheet) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-rose-700">
              {error || 'Data QR sheet tidak tersedia'}
            </p>
            <button
              onClick={() => navigate(`/personal-exams/${examId}/participants`)}
              className="mt-3 text-xs font-semibold text-rose-700 underline"
            >
              Kembali ke peserta
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (sheet.total === 0) {
    return (
      <div className="space-y-6">
        <Header
          examTitle={sheet.exam.title}
          onBack={() => navigate(`/personal-exams/${examId}/participants`)}
          onPrint={handlePrint}
        />
        <div className="rounded-2xl border border-dashed border-tp-border bg-white py-16 px-6 text-center">
          <p className="text-sm text-tp-muted">
            Belum ada peserta dengan access code. Generate kode dulu di halaman
            peserta.
          </p>
          <button
            onClick={() => navigate(`/personal-exams/${examId}/participants`)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            Kembali ke Peserta
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          /* Sembunyikan semua kecuali QR sheet */
          body * { visibility: hidden; }
          .qr-sheet-printable,
          .qr-sheet-printable * { visibility: visible; }
          .qr-sheet-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm 15mm;
          }

          .no-print { display: none !important; }

          /* Grid layout for print */
          .qr-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8mm !important;
          }

          .qr-card {
            page-break-inside: avoid;
            break-inside: avoid;
            border: 1.5px solid #d1d5db !important;
            padding: 6mm !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div className="space-y-6">
        <div className="no-print">
          <Header
            examTitle={sheet.exam.title}
            onBack={() => navigate(`/personal-exams/${examId}/participants`)}
            onPrint={handlePrint}
            total={sheet.total}
          />
        </div>

        <div className="no-print rounded-2xl border border-tp-border bg-white p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoItem label="Judul Ujian" value={sheet.exam.title} />
            <InfoItem label="Mata Pelajaran" value={sheet.exam.subject} />
            <InfoItem
              label="Total Soal"
              value={`${sheet.exam.total_questions} soal`}
            />
            <InfoItem
              label="Durasi"
              value={`${sheet.exam.duration_minutes} menit`}
            />
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            💡 <strong>Tips:</strong> Klik "Print" untuk cetak. Setiap siswa
            dapat 1 kartu QR — potong dan bagikan ke masing-masing siswa.
          </div>
        </div>


        <div className="qr-sheet-printable">
          {/* Print-only header */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">{sheet.exam.title}</h1>
            <p className="text-sm text-gray-600">
              {sheet.exam.subject} • {sheet.exam.total_questions} soal •{' '}
              {sheet.exam.duration_minutes} menit
            </p>
          </div>

          <div className="qr-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheet.entries.map((entry, idx) => (
              <QrCard key={idx} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}


function Header({
  examTitle, onBack, onPrint, total,
}: {
  examTitle: string
  onBack: () => void
  onPrint: () => void
  total?: number
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={onBack}
        className="grid h-9 w-9 place-items-center rounded-lg border border-tp-border bg-white hover:bg-slate-50 shrink-0"
      >
        <ArrowLeft className="h-4 w-4 text-tp-muted" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-tp-text">QR Sheet</h1>
        <p className="text-xs text-tp-muted mt-0.5 truncate">
          {examTitle}
          {total !== undefined && ` • ${total} kartu`}
        </p>
      </div>

      <button
        type="button"
        onClick={onPrint}
        className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3.5 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
      >
        <Printer className="h-3.5 w-3.5" />
        Print
      </button>
    </div>
  )
}

function QrCard({
  entry,
}: {
  entry: { full_name: string; student_number: string; nisn: string; access_code: string; exam_url: string }
}) {
  const qrUrl = useMemo(() => {
    const encoded = encodeURIComponent(entry.exam_url)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&margin=5`
  }, [entry.exam_url])

  return (
    <div className="qr-card rounded-xl border-2 border-tp-border bg-white p-4 flex flex-col items-center text-center">
      {/* Student info */}
      <p className="text-sm font-bold text-tp-text line-clamp-1 w-full">
        {entry.full_name}
      </p>
      <p className="text-[10px] text-tp-muted mb-3">
        {entry.nisn && `NISN: ${entry.nisn}`}
        {entry.nisn && entry.student_number && ' • '}
        {entry.student_number && `No: ${entry.student_number}`}
      </p>

      {/* QR */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 mb-3">
        <img
          src={qrUrl}
          alt={`QR untuk ${entry.full_name}`}
          className="h-32 w-32"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2394a3b8' font-size='11'%3EGagal load%3C/text%3E%3C/svg%3E`
          }}
        />
      </div>

      {/* Access code */}
      <div className="w-full">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-tp-muted mb-1">
          Kode Akses
        </p>
        <div className="rounded-lg bg-slate-100 py-1.5 px-3">
          <code className="text-sm font-mono font-bold tracking-widest text-tp-text">
            {entry.access_code}
          </code>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[9px] text-tp-faint mt-2 leading-tight">
        Scan QR atau buka link, lalu masukkan kode akses
      </p>
    </div>
  )
}


function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-tp-text">{value}</p>
    </div>
  )
}