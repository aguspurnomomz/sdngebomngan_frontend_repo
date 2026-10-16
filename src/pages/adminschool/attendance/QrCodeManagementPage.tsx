import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '../../../components/ui/button'
import {
  CheckCircle,
  X,
  Loader2,
  QrCode as QrCodeIcon,
  Printer,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface StudentWithQR {
  id: string
  full_name: string
  nisn: string
  student_number: string
  class_group_name: string
  sub_class_name: string
  qr_token: string | null
  has_qr: boolean
}

export default function QrCodeManagementPage() {
  const [students, setStudents] = useState<StudentWithQR[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedSubClass, setSelectedSubClass] = useState('')
  const [subClasses, setSubClasses] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return
      const headers = { Authorization: `Bearer ${token}` }

      const url = selectedSubClass
        ? `${API_URL}/api/school-admin/students?sub_class_id=${selectedSubClass}`
        : `${API_URL}/api/school-admin/students`

      const [studentsRes, qrRes, subClassesRes] = await Promise.allSettled([
        axios.get(url, { headers }),
        axios.get(`${API_URL}/api/school-admin/students/qr-list`, { headers }),
        axios.get(`${API_URL}/api/school-admin/sub-classes`, { headers }),
      ])

      const qrMap = new Map<string, string>()
      if (qrRes.status === 'fulfilled') {
        (qrRes.value.data?.qr_codes ?? []).forEach((qr: any) => {
          qrMap.set(qr.student_id, qr.qr_token)
        })
      }

      const studentList = studentsRes.status === 'fulfilled'
        ? (studentsRes.value.data?.students ?? [])
        : []

      setStudents(
        studentList.map((s: any) => ({
          ...s,
          qr_token: qrMap.get(s.id) || null,
          has_qr: qrMap.has(s.id),
        }))
      )

      if (subClassesRes.status === 'fulfilled') {
        setSubClasses(subClassesRes.value.data?.sub_classes ?? [])
      }
    } catch (error: any) {
      console.error(error)
      setErrorMessage('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [API_URL, selectedSubClass])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerateBulk = async () => {
    if (!confirm('Generate QR untuk semua siswa yang belum punya QR?')) return
    setGenerating(true)

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.post(
        `${API_URL}/api/school-admin/students/generate-qr-bulk`,
        {
          class_sub_group_id: selectedSubClass || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('QR berhasil di-generate!')
      await fetchData()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal generate QR')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateSingle = async (studentId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.post(
        `${API_URL}/api/school-admin/students/${studentId}/generate-qr`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('QR berhasil dibuat!')
      await fetchData()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal generate QR')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }


  const handlePrint = () => {
  const studentsWithQR = students.filter((s) => s.has_qr && s.qr_token)
  
  if (studentsWithQR.length === 0) {
    alert('Belum ada QR untuk di-print')
    return
  }

  // Buka window baru
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Popup diblokir. Mohon izinkan popup untuk situs ini.')
    return
  }

  // Generate semua QR code sebagai SVG string di React side
  const tempDiv = document.createElement('div')
  tempDiv.style.position = 'absolute'
  tempDiv.style.left = '-9999px'
  document.body.appendChild(tempDiv)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kartu QR Siswa</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .card {
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 20px;
          page-break-inside: avoid;
          text-align: center;
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .school-name { 
          font-size: 14px; 
          font-weight: bold; 
          color: #059669; 
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .qr-box { 
          margin: 12px auto; 
          width: 180px; 
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-box img { width: 180px; height: 180px; }
        .student-name { 
          font-size: 16px; 
          font-weight: bold; 
          margin-top: 12px;
          color: #111;
        }
        .student-info { 
          font-size: 11px; 
          color: #666; 
          margin-top: 4px;
        }
        .footer { 
          font-size: 9px; 
          color: #999; 
          margin-top: 12px; 
          font-style: italic;
        }
        @media print {
          @page { size: A4; margin: 10mm; }
          body { padding: 0; }
          .card { 
            box-shadow: none;
            border-color: #ddd;
          }
        }
      </style>
    </head>
    <body>
      <div class="grid">
        ${studentsWithQR
          .map(
            (s) => `
          <div class="card">
            <div class="school-name">SMA CITRA CEMARA</div>
            <div class="qr-box">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(s.qr_token || '')}&margin=0" 
                alt="QR ${s.full_name}"
                crossorigin="anonymous"
              />
            </div>
            <div class="student-name">${s.full_name}</div>
            <div class="student-info">NISN: ${s.nisn || '-'}</div>
            <div class="student-info">${s.class_group_name} - ${s.sub_class_name}</div>
            <div class="footer">Kartu ini untuk absensi digital. Jangan dibagikan.</div>
          </div>
        `
          )
          .join('')}
      </div>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
  }
}

  const filteredStudents = students

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tp-text">QR Code Siswa</h1>
          <p className="text-xs text-tp-muted">
            Generate, print, dan kelola QR code untuk absensi siswa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateBulk}
            disabled={generating || students.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <QrCodeIcon size={16} />}
            Generate Semua
          </Button>
          <Button
            onClick={handlePrint}
            disabled={students.filter((s) => s.has_qr).length === 0}
            variant="outline"
            className="inline-flex items-center gap-2 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-text hover:bg-gray-50 disabled:opacity-50"
          >
            <Printer size={16} />
            Print Kartu
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-900">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <X size={20} className="text-red-600" />
          <span className="text-xs font-semibold text-red-900">{errorMessage}</span>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-tp-muted">Filter Sub Kelas:</label>
        <select
          value={selectedSubClass}
          onChange={(e) => setSelectedSubClass(e.target.value)}
          className="rounded-xl border border-tp-border px-3 py-2 text-xs outline-none focus:border-tp-green bg-white"
        >
          <option value="">Semua Sub Kelas</option>
          {subClasses.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {sc.class_group_name} - {sc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Grid */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-center text-xs text-tp-muted py-12">Memuat...</p>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <QrCodeIcon size={32} className="mx-auto mb-3 opacity-40" />
            <p>Belum ada siswa. Tambahkan siswa terlebih dahulu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                className="border border-tp-border rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
              >
                {s.has_qr && s.qr_token ? (
                  <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <QRCodeSVG value={s.qr_token} size={120} level="M" />
                  </div>
                ) : (
                  <div className="w-[120px] h-[120px] bg-gray-100 rounded-xl flex items-center justify-center">
                    <QrCodeIcon size={40} className="text-gray-300" />
                  </div>
                )}

                <p className="text-sm font-bold text-tp-text mt-3 truncate w-full">
                  {s.full_name}
                </p>
                <p className="text-[10px] text-tp-muted mt-0.5 font-mono">
                  {s.nisn || 'NISN -'}
                </p>
                <p className="text-[10px] text-tp-muted">
                  {s.class_group_name} • {s.sub_class_name}
                </p>

                {s.has_qr ? (
                  <div className="mt-3 text-[10px] font-mono text-tp-muted bg-gray-50 px-2 py-1 rounded break-all">
                    {s.qr_token}
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerateSingle(s.id)}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-tp-green text-white px-3 py-1.5 text-[11px] font-medium hover:bg-tp-green-hover"
                  >
                    <QrCodeIcon size={12} />
                    Generate QR
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Print Area */}
      <div ref={printRef} className="hidden" />
    </div>
  )
}