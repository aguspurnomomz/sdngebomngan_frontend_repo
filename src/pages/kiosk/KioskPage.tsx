import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { CreditCard, WifiOff } from 'lucide-react'

interface ActiveSession {
  id: string
  title: string
  shift_name: string
  class_name: string
  status: string
  total_students: number
  total_check_in: number
}

interface ScanResult {
  success: boolean
  mode?: string
  status?: string
  student?: {
    id: string
    full_name: string
    nisn: string
    sub_class_name: string
    photo_url?: string
  }
  error?: string
  code?: string
}

export default function KioskPage() {
  const { deviceCode } = useParams<{ deviceCode: string }>()
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [deviceLabel, setDeviceLabel] = useState('')
  const [available, setAvailable] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const [history, setHistory] = useState<ScanResult[]>([])
  const [clock, setClock] = useState(new Date())

  const inputRef = useRef<HTMLInputElement>(null)
  const API_URL = import.meta.env.VITE_API_URL as string

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchSession = async () => {
    if (!deviceCode) return
    try {
      const res = await axios.get(`${API_URL}/api/kiosk/${deviceCode}/active-session`)
      if (res.data.available) {
        setSession(res.data.session)
        setDeviceLabel(res.data.device_label || '')
        setAvailable(true)
        setErrorMsg(null)
      } else {
        setSession(null)
        setAvailable(false)
        setErrorMsg(res.data.error || 'Tidak ada sesi aktif')
      }
    } catch (err: any) {
      setAvailable(false)
      setErrorMsg(err.response?.data?.error || 'Device tidak dikenal')
    }
  }

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 30_000)
    return () => clearInterval(interval)
  }, [deviceCode])

  useEffect(() => {
    const refocus = () => inputRef.current?.focus()
    refocus()
    const t = setInterval(refocus, 2000)
    document.addEventListener('click', refocus)
    return () => {
      clearInterval(t)
      document.removeEventListener('click', refocus)
    }
  }, [])

  // Auto dismiss overlay
  useEffect(() => {
    if (!lastScan) return
    const t = setTimeout(() => setLastScan(null), 3500)
    return () => clearTimeout(t)
  }, [lastScan])

  const handleRfidTap = async (uid: string) => {
    if (!uid) return
    if (!session) {
      setLastScan({ success: false, error: 'Tidak ada sesi aktif' })
      return
    }

    try {
      const res = await axios.post(`${API_URL}/api/kiosk/${deviceCode}/scan-rfid`, {
        session_id: session.id,
        rfid_uid: uid,
      })
      const result: ScanResult = {
        success: true,
        mode: res.data.mode,
        status: res.data.status,
        student: res.data.student,
      }
      setLastScan(result)
      setHistory((prev) => [result, ...prev].slice(0, 8))
      setSession((prev) =>
        prev ? { ...prev, total_check_in: prev.total_check_in + 1 } : null,
      )
    } catch (err: any) {
      const result: ScanResult = {
        success: false,
        error: err.response?.data?.error || 'Gagal memproses',
        code: err.response?.data?.code,
        student: err.response?.data?.student,
      }
      setLastScan(result)
      setHistory((prev) => [result, ...prev].slice(0, 8))
    }

    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }

  const timeStr = clock.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateStr = clock.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })


  if (!available) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col items-center justify-center text-white p-8">
        <WifiOff size={80} className="mb-6 opacity-60" />
        <h1 className="text-4xl font-bold mb-3">Kiosk Standby</h1>
        <p className="text-xl opacity-80 mb-2">{deviceLabel || deviceCode}</p>
        <p className="text-lg opacity-60 text-center max-w-md">
          {errorMsg || 'Menunggu sesi absensi dibuka oleh guru.'}
        </p>
        <p className="mt-8 text-2xl font-mono">{timeStr}</p>
        <p className="text-sm opacity-60">{dateStr}</p>

        {/* Hidden input tetap aktif supaya reader tidak error */}
        <input
          ref={inputRef}
          type="text"
          className="opacity-0 absolute pointer-events-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleRfidTap(e.currentTarget.value.trim().toUpperCase())
            }
          }}
        />
      </div>
    )
  }


  const progress =
    session && session.total_students > 0
      ? Math.round((session.total_check_in / session.total_students) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-tp-green/10 flex items-center justify-center">
            <CreditCard size={24} className="text-tp-green" />
          </div>
          <div>
            <p className="text-lg font-bold text-tp-text">{deviceLabel || deviceCode}</p>
            <p className="text-xs text-tp-muted">
              {session?.shift_name} — {session?.class_name || 'Semua Kelas'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold text-tp-text">{timeStr}</p>
          <p className="text-xs text-tp-muted">{dateStr}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
        <div className="w-full max-w-4xl">
          {/* Big tap prompt */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-dashed border-tp-green/40 p-12 text-center mb-8">
            <CreditCard size={80} className="mx-auto mb-4 text-tp-green animate-pulse" />
            <h1 className="text-5xl font-bold text-tp-text mb-3">TAP KARTU ANDA</h1>
            <p className="text-lg text-tp-muted mb-6">
              {session?.title}
            </p>

            {/* Progress */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-tp-text">
                  {session?.total_check_in} / {session?.total_students} siswa
                </span>
                <span className="font-bold text-tp-green">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-tp-green transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recent history */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
              <p className="px-5 py-3 text-xs font-bold text-tp-muted uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                Aktivitas Terakhir
              </p>
              <div className="divide-y divide-slate-100">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        h.success
                          ? h.status === 'late'
                            ? 'bg-amber-100'
                            : 'bg-emerald-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {h.success ? (h.status === 'late' ? '⏰' : '✅') : '❌'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-tp-text">
                        {h.student?.full_name || 'Kartu Tidak Dikenal'}
                      </p>
                      <p className="text-xs text-tp-muted">
                        {h.student?.sub_class_name} · {h.student?.nisn}
                      </p>
                    </div>
                    <div className="text-right">
                      {h.success ? (
                        <>
                          <p className="text-sm font-bold text-tp-text">
                            {h.mode === 'check_in' ? 'Check-In' : 'Check-Out'}
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              h.status === 'late'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {h.status?.toUpperCase().replace('_', ' ')}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-semibold text-red-600">
                          {h.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden RFID input */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute pointer-events-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleRfidTap(e.currentTarget.value.trim().toUpperCase())
          }
        }}
      />

      {/* Overlay feedback — fullscreen flash */}
      {lastScan && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
            lastScan.success
              ? lastScan.status === 'late'
                ? 'bg-amber-500/95'
                : 'bg-emerald-500/95'
              : 'bg-red-500/95'
          }`}
        >
          <div className="text-center text-white px-8">
            <div className="text-[120px] leading-none mb-6">
              {lastScan.success ? (lastScan.status === 'late' ? '⏰' : '✅') : '❌'}
            </div>
            <h2 className="text-6xl font-black mb-4">
              {lastScan.student?.full_name || 'KARTU TIDAK DIKENAL'}
            </h2>
            {lastScan.student && (
              <p className="text-3xl opacity-90 mb-2">
                {lastScan.student.sub_class_name} · {lastScan.student.nisn}
              </p>
            )}
            {lastScan.success ? (
              <p className="text-4xl font-bold mt-6">
                {lastScan.mode === 'check_in' ? 'CHECK-IN' : 'CHECK-OUT'} ·{' '}
                {lastScan.status?.toUpperCase().replace('_', ' ')}
              </p>
            ) : (
              <p className="text-3xl mt-6">{lastScan.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}