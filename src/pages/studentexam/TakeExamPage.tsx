import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Send, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  cognitive_level: string
}

export default function TakeExamPage() {
  const [searchParams] = useSearchParams()
  const sessionToken = searchParams.get('session')
  const [loadingSession, setLoadingSession] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionID, setSessionID] = useState('')
  const [examTitle, setExamTitle] = useState('Ujian Instan')
  const [questions, setQuestions] = useState<Question[]>([])
  const [step, setStep] = useState<'register' | 'exam' | 'finished'>('register')
  const [studentName, setStudentName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [nisn, setNisn] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0) 
  const [submitting, setSubmitting] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  useEffect(() => {
    const fetchExamData = async () => {
      if (!sessionToken) {
        setErrorMessage('Token sesi ujian tidak valid atau tidak ditemukan pada URL.')
        setLoadingSession(false)
        return
      }

      try {
        const res = await axios.get(`${API_URL}/api/exam/session-questions?token=${sessionToken}`)
        setSessionID(res.data.session_id)
        setExamTitle(res.data.title)
        setQuestions(res.data.questions || [])
      } catch (err: any) {
        console.error(err)
        setErrorMessage(err.response?.data?.error || 'Gagal memuat data ujian dari server.')
      } finally {
        setLoadingSession(false)
      }
    }
    fetchExamData()
  }, [sessionToken, API_URL])

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentName || !studentNumber || !nisn) {
      alert('Mohon lengkapi Nama, No Absen, dan NISN terlebih dahulu!')
      return
    }

    try {
      const checkRes = await axios.get(`${API_URL}/api/exam/check-student`, {
        params: { session_id: sessionID, nisn: nisn }
      })

      if (checkRes.data.has_submitted) {
        alert(`Akses ditolak! Peserta dengan NISN ${nisn} sudah pernah menyelesaikan ujian ini.`)
        return
      }

    
      setStep('exam')
    } catch (err: any) {
      console.error(err)
      alert('Gagal memvalidasi status peserta ke server.')
    }
  }

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
  }

  const handleSubmitExam = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengumpulkan jawaban ujian ini?')) {
      try {
        setSubmitting(true)
        await axios.post(`${API_URL}/api/exam/submit`, {
          session_id: sessionID,
          student_name: studentName,
          student_number: studentNumber,
          nisn: nisn,
          answers: answers,
        })
        setSubmitting(false)
        setStep('finished')
      } catch (err: any) {
        console.error(err)
        alert(err.response?.data?.error || 'Gagal mengirimkan jawaban ujian')
        setSubmitting(false)
      }
    }
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-tp-muted text-sm">
        Memuat lembar ujian dari server...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
        <Card className="rounded-2xl max-w-md w-full border-tp-border p-6 text-center space-y-3 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-tp-text">Gagal Membuka Ujian</h2>
          <p className="text-xs text-tp-muted">{errorMessage}</p>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header Identitas Sesi */}
        <div className="text-center space-y-1">
          <span className="inline-block rounded-full bg-emerald-100 text-tp-green px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Ujian Siswa
          </span>
          <h1 className="text-xl font-bold text-tp-text">{examTitle}</h1>
        </div>

        {step === 'register' && (
          <Card className="rounded-2xl border-tp-border shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleStartExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted uppercase tracking-wider mb-1">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: nama siswa"
                    className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 text-sm text-tp-text focus:border-tp-green focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-tp-muted uppercase tracking-wider mb-1">
                      No. Absen
                    </label>
                    <input
                      type="text"
                      required
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      placeholder="Contoh: 10"
                      className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 text-sm text-tp-text focus:border-tp-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-tp-muted uppercase tracking-wider mb-1">
                      NISN
                    </label>
                    <input
                      type="text"
                      required
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="Contoh: 0081234567"
                      className="w-full rounded-xl border border-tp-border bg-white px-3.5 py-2.5 text-sm text-tp-text focus:border-tp-green focus:outline-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-tp-green hover:bg-tp-green-hover text-white gap-2 rounded-xl py-3 font-semibold mt-2"
                >
                  Mulai Mengerjakan Ujian <BookOpen size={16} />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'exam' && currentQuestion && (
          <div className="space-y-4">
            {/* Info Siswa Ringkas */}
            <div className="rounded-xl bg-white border border-tp-border p-3 flex items-center justify-between text-xs text-tp-muted shadow-sm">
              <span>Siswa: <strong className="text-tp-text">{studentName}</strong></span>
              <span>Absen: <strong className="text-tp-text">{studentNumber}</strong></span>
            </div>

            {/* NAVIGASI NOMOR SOAL DI ATAS */}
            <div className="bg-white border border-tp-border rounded-2xl p-3.5 shadow-sm">
              <span className="block text-[11px] font-semibold text-tp-faint uppercase mb-2">Nomor Soal:</span>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id])
                  const isCurrent = idx === currentIndex
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition flex items-center justify-center border ${
                        isCurrent
                          ? 'bg-tp-green text-white border-tp-green shadow-sm'
                          : isAnswered
                          ? 'bg-emerald-50 text-tp-green border-emerald-200'
                          : 'bg-slate-100 text-tp-muted border-tp-border hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* KARTU SOAL AKTIF */}
            <Card className="rounded-2xl border-tp-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-tp-green uppercase tracking-wide">
                    Soal Nomor {currentIndex + 1} dari {questions.length}
                  </span>
                  <span className="text-[11px] font-semibold bg-slate-100 text-tp-muted px-2.5 py-1 rounded-lg">
                    {currentQuestion.cognitive_level || 'Pilihan Ganda'}
                  </span>
                </div>

                <p className="text-base font-semibold text-tp-text leading-relaxed">
                  {currentQuestion.question_text}
                </p>

                <div className="space-y-2.5 pt-2">
                  {Array.isArray(currentQuestion.options) &&
                    currentQuestion.options.map((opt) => {
                      const optKey = opt.charAt(0) // Mengambil huruf 'A', 'B', 'C', 'D'
                      const isSelected = answers[currentQuestion.id] === optKey
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => handleSelectOption(currentQuestion.id, optKey)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition border ${
                            isSelected
                              ? 'bg-emerald-50 border-tp-green text-tp-green font-bold shadow-sm'
                              : 'bg-white border-tp-border text-tp-text hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            {/* navigasi button */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="flex-1 rounded-xl border-tp-border py-2.5 text-xs font-semibold gap-2"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex-1 bg-tp-green hover:bg-tp-green-hover text-white rounded-xl py-2.5 text-xs font-semibold gap-2"
                >
                  Selanjutnya <ChevronRight size={16} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="flex-1 bg-tp-green hover:bg-tp-green-hover text-white rounded-xl py-2.5 text-xs font-semibold gap-2 shadow-sm"
                >
                  <Send size={14} /> {submitting ? 'Mengirim...' : 'Kumpul Ujian'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SELESAI */}
        {step === 'finished' && (
          <Card className="rounded-2xl border-tp-border shadow-sm text-center py-8">
            <CardContent className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-tp-green">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-bold text-tp-text">Jawaban ujian berhasil disimpan!</h2>
              <p className="text-xs text-tp-muted max-w-sm mx-auto">
                Terima kasih <strong>{studentName}</strong>. Lembar jawaban dan hasil nilai Anda telah terekam di system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}