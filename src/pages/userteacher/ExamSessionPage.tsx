import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, RefreshCw, Layers, Eye, Trash2, RotateCcw, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface QuestionBank {
  id: string
  title: string
  subject: string
  phase: string
}

interface ExamSession {
  id: string
  title: string
  qr_code_token: string
  duration_minutes: number
  is_active: boolean
  created_at: string
  deleted_at?: string
}

interface Submission {
  id: string
  student_name: string
  student_number: string
  nisn: string
  score: number
  submitted_at: string
}

export default function ExamSessionPage({ session }: { session: any }) {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [examSessions, setExamSessions] = useState<ExamSession[]>([])
  const [trashSessions, setTrashSessions] = useState<ExamSession[]>([])
  const [selectedBankId, setSelectedBankId] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [duration, setDuration] = useState(60)
  const [loadingBanks, setLoadingBank] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active')

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  
  const [generatedSession, setGeneratedSession] = useState<{
    id: string
    token: string
    title: string
  } | null>(null)

  // Pagination States
  const [sessionPage, setSessionPage] = useState(1)
  const sessionsPerPage = 5

  const [submissionPage, setSubmissionPage] = useState(1)
  const submissionsPerPage = 10

  const API_URL = import.meta.env.VITE_API_URL

  // Helper untuk mengambil token Auth konsisten dengan ProfilePage
  const getAuthHeader = () => {
    const token = session?.access_token || localStorage.getItem('token') || localStorage.getItem('access_token') || ''
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  const fetchData = async () => {
    try {
      setLoadingBank(true)
      const [banksRes, sessionsRes, trashRes] = await Promise.all([
        axios.get(`${API_URL}/api/my-question-banks`, getAuthHeader()),
        axios.get(`${API_URL}/api/exam-sessions`, getAuthHeader()),
        axios.get(`${API_URL}/api/exam-sessions/trash`, getAuthHeader())
      ])

      setQuestionBanks(banksRes.data.question_banks || [])
      if (banksRes.data.question_banks?.length > 0) {
        setSelectedBankId(banksRes.data.question_banks[0].id)
        setExamTitle(banksRes.data.question_banks[0].title)
      }

      setExamSessions(sessionsRes.data.sessions || [])
      setTrashSessions(trashRes.data.trash_sessions || [])
    } catch (err) {
      console.error('Gagal memuat data:', err)
    } finally {
      setLoadingBank(false)
    }
  }

  useEffect(() => {
    if (session?.access_token) {
      fetchData()
    }
  }, [session, API_URL])

  const fetchSubmissions = async (sessionId: string) => {
    try {
      setLoadingSubmissions(true)
      const res = await axios.get(`${API_URL}/api/exam-sessions/${sessionId}/submissions`, getAuthHeader())
      setSubmissions(res.data.submissions || [])
      setSubmissionPage(1)
    } catch (err) {
      console.error('Gagal memuat log siswa:', err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Hapus sesi ujian ini ke tempat sampah?')) return

    try {
      await axios.delete(`${API_URL}/api/exam-sessions/${sessionId}`, getAuthHeader())
      if (generatedSession?.id === sessionId) {
        setGeneratedSession(null)
        setSubmissions([])
      }
      fetchData()
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Gagal menghapus sesi ujian')
    }
  }

  const handleRestoreSession = async (sessionId: string) => {
    try {
      await axios.post(`${API_URL}/api/exam-sessions/${sessionId}/restore`, {}, getAuthHeader())
      fetchData()
      alert('Sesi ujian berhasil dipulihkan!')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Gagal memulihkan sesi ujian')
    }
  }

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
      const res = await axios.post(
        `${API_URL}/api/exam-sessions`,
        {
          title: examTitle,
          question_bank_id: selectedBankId,
          duration_minutes: Number(duration),
        },
        getAuthHeader()
      )

      const newSession = {
        id: res.data.session_id,
        token: res.data.qr_code_token,
        title: examTitle,
      }

      setGeneratedSession(newSession)
      fetchSubmissions(newSession.id)
      fetchData()
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Gagal membuat sesi ujian')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectActiveSession = (sessionItem: ExamSession) => {
    setGeneratedSession({
      id: sessionItem.id,
      token: sessionItem.qr_code_token,
      title: sessionItem.title,
    })
    fetchSubmissions(sessionItem.id)
  }

  // Pagination Logic for Sessions
  const indexOfLastSession = sessionPage * sessionsPerPage
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage
  const currentSessions = (activeTab === 'active' ? examSessions : trashSessions).slice(indexOfFirstSession, indexOfLastSession)
  const totalSessionPages = Math.ceil((activeTab === 'active' ? examSessions.length : trashSessions.length) / sessionsPerPage)

  // Pagination Logic for Submissions
  const indexOfLastSub = submissionPage * submissionsPerPage
  const indexOfFirstSub = indexOfLastSub - submissionsPerPage
  const currentSubmissions = submissions.slice(indexOfFirstSub, indexOfLastSub)
  const totalSubPages = Math.ceil(submissions.length / submissionsPerPage)

  const studentExamUrl = generatedSession
    ? `${window.location.origin}/exam/take?session=${generatedSession.token}`
    : ''

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
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
              <Settings size={18} className="text-tp-green" /> Konfigurasi Ujian
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
                    Belum ada bank soal di database. Silakan buat bank soal terlebih dahulu di menu Bank Soal.
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
        <div className="space-y-6">
          <Card className="rounded-2xl border-tp-border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-tp-text">
                <QrCode size={18} className="text-tp-green" /> QR Code Sesi Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1 py-6 text-center">
              {generatedSession ? (
                <div className="space-y-4 flex flex-col items-center w-full">
                  <div className="p-4 bg-white rounded-2xl border-2 border-tp-border shadow-sm">
                    <QRCodeSVG value={studentExamUrl} size={160} level="H" />
                  </div>
                  <div>
                    <h3 className="font-bold text-tp-text text-base">{generatedSession.title}</h3>
                    <p className="text-xs text-tp-faint mt-1">Sesi Aktif Dipilih</p>
                  </div>
                  <div className="w-full bg-slate-50 border border-tp-border rounded-xl p-3 text-left">
                    <span className="block text-[11px] font-semibold text-tp-faint uppercase">Link Akses Siswa:</span>
                    <code className="text-xs text-tp-green break-all select-all">{studentExamUrl}</code>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-tp-faint space-y-2">
                  <Settings size={48} className="mx-auto opacity-30" />
                  <p className="text-sm">Belum ada sesi yang dipilih.</p>
                  <p className="text-xs">Terbitkan sesi baru atau pilih dari daftar sesi aktif di bawah.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DAFTAR SESI UJIAN AKTIF & TRASH BIN TAB */}
      <Card className="rounded-2xl border-tp-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-tp-text">
              <Layers size={18} className="text-tp-green" /> 
              {activeTab === 'active' ? 'Daftar Sesi Ujian Aktif' : 'Tempat Sampah'}
            </CardTitle>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
              <Button
                size="sm"
                variant={activeTab === 'active' ? 'default' : 'ghost'}
                onClick={() => { setActiveTab('active'); setSessionPage(1); }}
                className={`h-7 text-xs ${activeTab === 'active' ? 'bg-tp-green hover:bg-tp-green-hover text-white' : 'text-tp-muted'}`}
              >
                Aktif ({examSessions.length})
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'trash' ? 'default' : 'ghost'}
                onClick={() => { setActiveTab('trash'); setSessionPage(1); }}
                className={`h-7 text-xs gap-1 ${activeTab === 'trash' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-tp-muted'}`}
              >
                <Trash2 size={13} /> Sampah ({trashSessions.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'active' && examSessions.length === 0 ? (
            <p className="text-xs text-tp-faint py-4 text-center">Belum ada sesi ujian aktif.</p>
          ) : activeTab === 'trash' && trashSessions.length === 0 ? (
            <p className="text-xs text-tp-faint py-4 text-center">Tempat sampah kosong.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-tp-muted uppercase">
                    <tr>
                      <th className="p-3">Judul Ujian</th>
                      <th className="p-3">Durasi</th>
                      <th className="p-3">{activeTab === 'active' ? 'Dibuat Pada' : 'Dihapus Pada'}</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-border bg-white">
                    {currentSessions.map((sessionItem) => {
                      const isSelected = generatedSession?.id === sessionItem.id
                      return (
                        <tr key={sessionItem.id} className={`hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/50' : ''}`}>
                          <td className="p-3 font-semibold text-tp-text">{sessionItem.title}</td>
                          <td className="p-3">{sessionItem.duration_minutes} Menit</td>
                          <td className="p-3 text-tp-faint">
                            {activeTab === 'active' 
                              ? new Date(sessionItem.created_at).toLocaleString('id-ID') 
                              : sessionItem.deleted_at ? new Date(sessionItem.deleted_at).toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {activeTab === 'active' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => handleSelectActiveSession(sessionItem)}
                                  className={`h-8 text-xs gap-1.5 ${isSelected ? 'bg-tp-green hover:bg-tp-green-hover text-white' : ''}`}
                                >
                                  <Eye size={14} /> {isSelected ? 'Dipantau' : 'Pantau'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleDeleteSession(sessionItem.id, e)}
                                  className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                >
                                  <Trash2 size={14} /> Hapus
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreSession(sessionItem.id)}
                                className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                              >
                                <RotateCcw size={14} /> Pulihkan
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalSessionPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-tp-faint">
                    Halaman {sessionPage} dari {totalSessionPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sessionPage === 1}
                      onClick={() => setSessionPage(prev => Math.max(prev - 1, 1))}
                      className="h-7 px-2 text-xs"
                    >
                      <ChevronLeft size={14} /> Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sessionPage === totalSessionPages}
                      onClick={() => setSessionPage(prev => Math.min(prev + 1, totalSessionPages))}
                      className="h-7 px-2 text-xs"
                    >
                      Next <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* PANEL LOG MONITORING SISWA */}
      {generatedSession && activeTab === 'active' && (
        <Card className="rounded-2xl border-tp-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-tp-text">
                Log Monitoring: <span className="text-tp-green">{generatedSession.title}</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchSubmissions(generatedSession.id)}
                disabled={loadingSubmissions}
                className="text-xs h-8 gap-1.5"
              >
                <RefreshCw size={14} className={loadingSubmissions ? 'animate-spin' : ''} />
                Refresh Log
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto border border-tp-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-tp-muted uppercase">
                  <tr>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Absen</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Nilai</th>
                    <th className="p-3">Waktu Kumpul</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-border bg-white">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-tp-faint">Belum ada siswa yang mengumpulkan jawaban pada sesi ini.</td>
                    </tr>
                  ) : (
                    currentSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-tp-text">{sub.student_name}</td>
                        <td className="p-3">{sub.student_number}</td>
                        <td className="p-3">{sub.nisn}</td>
                        <td className="p-3 font-bold text-tp-green">{sub.score}</td>
                        <td className="p-3 text-tp-faint">{new Date(sub.submitted_at).toLocaleTimeString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalSubPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-tp-faint">
                  Halaman {submissionPage} dari {totalSubPages} (Total {submissions.length} siswa)
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submissionPage === 1}
                    onClick={() => setSubmissionPage(prev => Math.max(prev - 1, 1))}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronLeft size={14} /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submissionPage === totalSubPages}
                    onClick={() => setSubmissionPage(prev => Math.min(prev + 1, totalSubPages))}
                    className="h-7 px-2 text-xs"
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}