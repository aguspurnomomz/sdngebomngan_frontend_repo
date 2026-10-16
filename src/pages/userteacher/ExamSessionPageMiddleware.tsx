import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Sparkles, RefreshCw, BookOpen } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface QuestionBank {
  id: string
  title: string
  subject: string
  phase: string
}

export default function ExamSessionPage() {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [selectedBankId, setSelectedBankId] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [duration, setDuration] = useState(60)
  const [loadingBanks, setLoadingBank] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [generatedSession, setGeneratedSession] = useState<{
    token: string
    title: string
  } | null>(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Ambil daftar bank soal yang pernah dibuat guru dari database
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem('token') // Token user guru
        const res = await axios.get(`${API_URL}/api/my-question-banks`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setQuestionBanks(res.data.question_banks || [])
        if (res.data.question_banks?.length > 0) {
          setSelectedBankId(res.data.question_banks[0].id)
          setExamTitle(res.data.question_banks[0].title)
        }
      } catch (err) {
        console.error('Gagal memuat bank soal:', err)
      } finally {
        setLoadingBank(false)
      }
    }
    fetchBanks()
  }, [API_URL])

  const handleSelectBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedBankId(id)
    const found = questionBanks.find((b) => b.id === id)
    if (found) {
      setExamTitle(found.title)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBankId) {
      alert('Pilih bank soal terlebih dahulu!')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const res = await axios.post(
        `${API_URL}/api/exam-sessions`,
        {
          title: examTitle,
          question_bank_id: selectedBankId,
          duration_minutes: Number(duration),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setGeneratedSession({
        token: res.data.qr_code_token,
        title: examTitle,
      })
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Gagal membuat sesi ujian')
    } finally {
      setSubmitting(false)
    }
  }

  const studentExamUrl = generatedSession
    ? `${window.location.origin}/exam/take?session=${generatedSession.token}`
    : ''

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text sm:text-[28px]">Ujian Instan QR Code</h1>
        <p className="text-sm text-tp-muted">
          Pilih bank soal dari database Anda dan buat sesi ujian instan tanpa akun siswa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Pilih Bank Soal & Buat Sesi */}
        <Card className="rounded-2xl border-tp-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-tp-text">
              {/* <Sparkles size={18} className="text-tp-green" /> Konfigurasi Ujian */}
              <Sparkles size={18} className="text-tp-green" /> Konfigurasi Ujian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted uppercase tracking-wider mb-1.5">
                  Pilih Bank Soal Anda
                </label>
                {loadingBanks ? (
                  <p className="text-xs text-tp-faint">Memuat bank soal...</p>
                ) : questionBanks.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    Belum ada bank soal. Buat terlebih dahulu di menu <strong>Bank Soal</strong>.
                  </div>
                ) : (
                  <select
                    value={selectedBankId}
                    onChange={handleSelectBankChange}
                    className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 text-sm text-tp-text focus:border-tp-green focus:outline-none"
                  >
                    {questionBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.subject} - {b.phase})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted uppercase tracking-wider mb-1.5">
                  Judul Ujian Tampil ke Siswa
                </label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 text-sm text-tp-text focus:border-tp-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted uppercase tracking-wider mb-1.5">
                  Durasi Pengerjaan (Menit)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 text-sm text-tp-text focus:border-tp-green focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || questionBanks.length === 0}
                className="w-full bg-tp-green hover:bg-tp-green-hover text-white gap-2 rounded-xl py-2.5 font-semibold mt-2"
              >
                <RefreshCw size={16} className={submitting ? 'animate-spin' : ''} />
                {submitting ? 'Memproses Sesi...' : 'Terbitkan Sesi & Generate QR'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Panel QR Code */}
        <Card className="rounded-2xl border-tp-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-tp-text">
              <QrCode size={18} className="text-tp-green" /> QR Code Sesi Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1 py-6 text-center">
            {generatedSession ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-tp-border shadow-sm">
                  <QRCodeSVG value={studentExamUrl} size={180} level="H" />
                </div>
                <div>
                  <h3 className="font-bold text-tp-text text-base">{generatedSession.title}</h3>
                  <p className="text-xs text-tp-faint mt-1">Terhubung ke Database Soal</p>
                </div>
                <div className="w-full bg-slate-50 border border-tp-border rounded-xl p-3 text-left">
                  <span className="block text-[11px] font-semibold text-tp-faint uppercase">Link Akses Siswa:</span>
                  <code className="text-xs text-tp-green break-all select-all">{studentExamUrl}</code>
                </div>
              </div>
            ) : (
              <div className="py-12 text-tp-faint space-y-2">
                <BookOpen size={48} className="mx-auto opacity-30" />
                <p className="text-sm">Belum ada sesi yang diterbitkan.</p>
                <p className="text-xs">Pilih bank soal lalu klik terbitkan.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}