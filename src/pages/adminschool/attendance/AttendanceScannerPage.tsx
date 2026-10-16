import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Lock,
} from 'lucide-react'

import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'


interface SessionInfo {
  id: string
  title: string
  session_date: string
  status: string
  shift_name: string
  shift_code: string
  class_group_name: string
  class_sub_group_name: string
  total_students: number
  total_check_in: number
  total_absent: number
}

interface ScanLog {
  id: string
  timestamp: string
  student_name: string
  status: 'success' | 'duplicate' | 'error' | 'unknown'
  message: string
  mode?: 'check_in' | 'check_out'
  student_class?: string
  source?: 'qr' | 'rfid'
}

type ScanMode = 'qr' | 'rfid'

const SAME_TOKEN_COOLDOWN_MS = 60_000  

const SUCCESS_OVERLAY_MS = 1_500

export default function AttendanceScannerPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(false)
  const [lastSuccessName, setLastSuccessName] = useState<string>('')
  const [scanMode, setScanMode] = useState<ScanMode>('qr')

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef<boolean>(false)
  const sessionIdRef = useRef<string | null>(null)
  const rfidInputRef = useRef<HTMLInputElement>(null)
  const startScannerRef = useRef<(() => Promise<void>) | null>(null)

  const lastScannedTokenRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)

  const soundEnabledRef = useRef<boolean>(true)
  const handleScanRef = useRef<(text: string) => void>(() => {})

  const API_URL = import.meta.env.VITE_API_URL as string

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }


  const playBeep = useCallback((type: 'success' | 'duplicate' | 'error') => {
    if (!soundEnabledRef.current) return
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      let freq = 800
      let duration = 0.15
      if (type === 'success') { freq = 1000; duration = 0.12 }
      else if (type === 'duplicate') { freq = 600; duration = 0.2 }
      else { freq = 300; duration = 0.4 }

      oscillator.frequency.value = freq
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + duration,
      )
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + duration)
    } catch {}
  }, [])


  const addLog = useCallback((log: Omit<ScanLog, 'id' | 'timestamp'>) => {
    const newLog: ScanLog = {
      ...log,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }
    setScanLogs((prev) => [newLog, ...prev].slice(0, 50))
  }, [])

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      on_time: 'Tepat Waktu',
      early: 'Datang Cepat',
      late: 'Terlambat',
      very_late: 'Sangat Terlambat',
      on_time_leave: 'Pulang Tepat',
      early_leave: 'Pulang Cepat',
      late_leave: 'Pulang Terlambat',
    }
    return map[status] || status
  }


  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return
      const res = await axios.get(
        `${API_URL}/api/school-admin/attendance/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setSession(res.data?.session)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Gagal memuat sesi')
    } finally {
      setLoading(false)
    }
  }, [API_URL, sessionId])

  useEffect(() => {
    sessionIdRef.current = sessionId ?? null
    fetchSession()
  }, [fetchSession, sessionId])

 
  useEffect(() => {
    if (scanMode === 'rfid') {
      const focus = () => rfidInputRef.current?.focus()
      focus()
      const interval = setInterval(focus, 2000)
      return () => clearInterval(interval)
    }
  }, [scanMode])


  const handleScan = useCallback(
    async (decodedText: string) => {
      const now = Date.now()
      const token = decodedText.trim()
      if (!token) return

      if (processingRef.current) return

      if (
        token === lastScannedTokenRef.current &&
        now - lastScanTimeRef.current < SAME_TOKEN_COOLDOWN_MS
      ) {
        return
      }

      lastScanTimeRef.current = now
      lastScannedTokenRef.current = token
      processingRef.current = true

      try {
        const authToken = await getAuthToken()
        if (!authToken) {
          processingRef.current = false
          return
        }

        const res = await axios.post(
          `${API_URL}/api/school-admin/attendance/scan`,
          {
            session_id: sessionIdRef.current,
            qr_token: token,
          },
          { headers: { Authorization: `Bearer ${authToken}` } },
        )

        const data = res.data

        if (data.success) {
          playBeep('success')
          setLastSuccessName(data.student?.full_name || 'Siswa')
          setCooldown(true)
          setTimeout(() => setCooldown(false), SUCCESS_OVERLAY_MS)

          addLog({
            status: 'success',
            student_name: data.student?.full_name || 'Siswa',
            message: `${data.mode === 'check_out' ? 'Pulang' : 'Datang'} - ${getStatusLabel(data.status)}`,
            mode: data.mode,
            student_class: data.student?.sub_class_name,
            source: 'qr',
          })
          await fetchSession()

        }
      } catch (error: any) {
        const status = error.response?.status
        const data = error.response?.data || {}

        let logStatus: ScanLog['status'] = 'error'
        let msg = data.error || error.message

        if (status === 409 || data.duplicate) {
          logStatus = 'duplicate'
          msg = data.error || 'Sudah tercatat'
          playBeep('duplicate')
        } else if (status === 404) {
          logStatus = 'unknown'
          msg = data.error || 'QR tidak dikenal'
          playBeep('error')
        } else {
          playBeep('error')
        }

        addLog({
          status: logStatus,
          student_name: data.student?.full_name || 'Unknown',
          message: msg,
          source: 'qr',
        })
      } finally {
        processingRef.current = false
      }
    },
    [API_URL, fetchSession, addLog, playBeep],
  )

  useEffect(() => {
    handleScanRef.current = handleScan
  }, [handleScan])


  const handleRfidSubmit = useCallback(
    async (uidRaw: string) => {
      const uid = uidRaw.trim().toUpperCase()
      if (!uid || !sessionIdRef.current) return

      const now = Date.now()

      if (
        uid === lastScannedTokenRef.current &&
        now - lastScanTimeRef.current < SAME_TOKEN_COOLDOWN_MS
      ) {
        return
      }
      if (processingRef.current) return

      lastScannedTokenRef.current = uid
      lastScanTimeRef.current = now
      processingRef.current = true

      try {
        const authToken = await getAuthToken()
        if (!authToken) return

        const res = await axios.post(
          `${API_URL}/api/school-admin/attendance/scan-rfid`,
          {
            session_id: sessionIdRef.current,
            rfid_uid: uid,
          },
          { headers: { Authorization: `Bearer ${authToken}` } },
        )

        const data = res.data

        if (data.success) {
          playBeep('success')
          setLastSuccessName(data.student?.full_name || 'Siswa')
          setCooldown(true)
          setTimeout(() => setCooldown(false), SUCCESS_OVERLAY_MS)

          addLog({
            status: 'success',
            student_name: data.student?.full_name || 'Siswa',
            message: `${data.mode === 'check_out' ? 'Pulang' : 'Datang'} - ${getStatusLabel(data.status)}`,
            mode: data.mode,
            student_class: data.student?.sub_class_name,
            source: 'rfid',
          })
          await fetchSession()
        }
      } catch (err: any) {
        const status = err.response?.status
        const data = err.response?.data || {}

        let logStatus: ScanLog['status'] = 'error'
        let msg = data.error || err.message

        if (status === 409 || data.duplicate) {
          logStatus = 'duplicate'
          msg = data.error || 'Sudah tercatat'
          playBeep('duplicate')
        } else if (status === 404) {
          logStatus = 'unknown'
          msg = data.error || 'Kartu tidak dikenal'
          playBeep('error')
        } else {
          playBeep('error')
        }

        addLog({
          status: logStatus,
          student_name: data.student?.full_name || 'Kartu Unknown',
          message: msg,
          source: 'rfid',
        })
      } finally {
        processingRef.current = false
        if (rfidInputRef.current) {
          rfidInputRef.current.value = ''
          rfidInputRef.current.focus()
        }
      }
    },
    [API_URL, fetchSession, addLog, playBeep],
  )

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanRef.current(decodedText)
        },
        () => {},
      )

      setIsScanning(true)
    } catch (err: any) {
      console.error('Gagal start scanner:', err)
      // Cleanup supaya bisa retry
      if (scannerRef.current) {
        try { await scannerRef.current.clear() } catch {}
        scannerRef.current = null
      }
      setError(
        'Gagal mengakses kamera. Pastikan browser punya izin kamera dan tidak dipakai aplikasi lain.',
      )
    }
  }, [])

  useEffect(() => {
    startScannerRef.current = startScanner
  }, [startScanner])


  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return
    try {
      await scannerRef.current.stop()
      try { scannerRef.current.clear() } catch {}
    } catch (e) {
      console.error('Stop scanner error:', e)
    } finally {
      scannerRef.current = null
      setIsScanning(false)
    }
  }, [])


  useEffect(() => {
    if (scanMode === 'qr') {
      if (!scannerRef.current) {
        startScanner()
      }
    } else {
      if (scannerRef.current) {
        stopScanner()
      }
    }
  }, [scanMode])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])


  const handleCloseSession = async () => {
    if (!sessionId) return
    if (!confirm('Tutup sesi ini? Siswa yang belum check-in akan ditandai ABSEN.')) return

    try {
      const token = await getAuthToken()
      if (!token) return
      await stopScanner()
      const res = await axios.post(
        `${API_URL}/api/school-admin/attendance/sessions/${sessionId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const absentCount = res.data?.absent_count ?? 0
      alert(`Sesi ditutup. ${absentCount} siswa ditandai ABSEN.`)
      navigate('/school-admin/dashboard/attendance/sessions')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menutup sesi')
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-tp-muted">Memuat sesi...</p>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <XCircle size={48} className="text-red-500" />
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white"
        >
          Kembali
        </button>
      </div>
    )
  }

  if (!session) return null

  const isClosed = session.status === 'closed' || session.status === 'auto_closed'
  const progress =
    session.total_students > 0
      ? Math.round((session.total_check_in / session.total_students) * 100)
      : 0

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-tp-border p-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-tp-muted hover:text-tp-text"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <div className="flex items-center gap-2 text-xs">
          {!isClosed && (
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-2 rounded-lg text-tp-muted hover:bg-gray-100"
              title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-2xl border border-tp-border p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-bold text-tp-text">{session.title}</h1>
            <div className="flex items-center gap-3 text-xs text-tp-muted mt-1 flex-wrap">
              <span>{session.shift_name} ({session.shift_code})</span>
              {session.class_group_name && (
                <span>
                  {session.class_group_name}
                  {session.class_sub_group_name && ` - ${session.class_sub_group_name}`}
                </span>
              )}
              <span>
                {new Date(session.session_date + 'T00:00:00').toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-tp-green">
              {session.total_check_in}/{session.total_students}
            </div>
            <p className="text-[10px] text-tp-muted uppercase tracking-wider">Hadir</p>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-tp-green transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 rounded-xl bg-emerald-50">
            <p className="text-lg font-bold text-emerald-700">{session.total_check_in}</p>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Hadir</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-red-50">
            <p className="text-lg font-bold text-red-700">{session.total_absent}</p>
            <p className="text-[10px] text-red-600 uppercase tracking-wide">Absen</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50">
            <p className="text-lg font-bold text-blue-700">
              {Math.max(0, session.total_students - session.total_check_in - session.total_absent)}
            </p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide">Belum</p>
          </div>
        </div>
      </div>

      {/* Scan Mode Toggle */}
      {!isClosed && (
        <div className="bg-white rounded-2xl border border-tp-border p-2 flex gap-2">
          <button
            onClick={() => setScanMode('qr')}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              scanMode === 'qr'
                ? 'bg-tp-green text-white shadow-sm'
                : 'bg-white text-tp-muted hover:bg-gray-50'
            }`}
          >
            <QrCode size={14} />
            Scan QR Code
          </button>
          <button
            onClick={() => setScanMode('rfid')}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              scanMode === 'rfid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-tp-muted hover:bg-gray-50'
            }`}
          >
            <CreditCard size={14} />
            Scan Kartu RFID
          </button>
        </div>
      )}

      {/* Scanner Area */}
      <div className="bg-white rounded-2xl border border-tp-border overflow-hidden">
        {isClosed ? (
          <div className="p-12 text-center">
            <Lock size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-tp-text mb-1">Sesi Sudah Ditutup</p>
            <p className="text-xs text-tp-muted mb-4">
              Absensi tidak bisa dilanjutkan. Lihat rekap untuk detail.
            </p>
            <button
              onClick={() =>
                navigate(`/school-admin/dashboard/attendance/reports?session=${session.id}`)
              }
              className="rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
            >
              Lihat Rekap
            </button>
          </div>
        ) : scanMode === 'qr' ? (
          <>
            <div className="relative bg-black">
              <div id="qr-reader" className="w-full min-h-[400px]" />

              {cooldown && (
                <div className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center z-10 pointer-events-none">
                  <div className="text-white text-center">
                    <CheckCircle size={64} className="mx-auto mb-2" />
                    <p className="text-lg font-bold">{lastSuccessName}</p>
                    <p className="text-sm opacity-90 mt-1">Scan berhasil</p>
                  </div>
                </div>
              )}

              {!isScanning && !cooldown && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4">
                  <Camera size={48} className="opacity-50" />
                  <p className="text-sm font-medium">Scanner Kamera Nonaktif</p>
                  <button
                    onClick={startScanner}
                    className="rounded-xl bg-tp-green px-6 py-3 text-sm font-semibold text-white hover:bg-tp-green-hover inline-flex items-center gap-2"
                  >
                    <Camera size={18} />
                    Aktifkan Kamera
                  </button>
                </div>
              )}

              {isScanning && !cooldown && (
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                  <p className="inline-block bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                    Arahkan QR siswa ke kamera
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 flex items-center justify-between gap-3 border-t border-tp-border">
              <div className="flex items-center gap-2 text-xs text-tp-muted">
                <QrCode size={14} />
                {isScanning ? 'Arahkan QR siswa ke kamera' : 'Kamera nonaktif'}
              </div>
              <div className="flex items-center gap-2">
                {isScanning && (
                  <button
                    onClick={stopScanner}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-600 px-3 py-2 text-xs font-medium hover:bg-red-100"
                  >
                    <CameraOff size={14} />
                    Matikan Kamera
                  </button>
                )}
                <button
                  onClick={handleCloseSession}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 text-white px-3 py-2 text-xs font-medium hover:bg-amber-600"
                >
                  <Lock size={14} />
                  Tutup Sesi
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ===================== RFID MODE ===================== */
          <>
            <div className="relative">
              {cooldown && (
                <div className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center z-10 pointer-events-none">
                  <div className="text-white text-center">
                    <CheckCircle size={64} className="mx-auto mb-2" />
                    <p className="text-lg font-bold">{lastSuccessName}</p>
                    <p className="text-sm opacity-90 mt-1">Tap berhasil</p>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-indigo-300 rounded-none py-20 text-center bg-indigo-50/30">
                <CreditCard
                  size={80}
                  className="mx-auto mb-4 text-indigo-500 animate-pulse"
                />
                <p className="text-2xl font-bold text-indigo-700">
                  📡 Tap Kartu ke Reader
                </p>
                <p className="text-sm text-tp-muted mt-2">
                  UID akan otomatis ter-input saat kartu ditempelkan
                </p>

                <input
                  ref={rfidInputRef}
                  type="text"
                  className="opacity-0 absolute pointer-events-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleRfidSubmit(e.currentTarget.value)
                    }
                  }}
                />
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3 border-t border-tp-border">
              <div className="flex items-center gap-2 text-xs text-tp-muted">
                <CreditCard size={14} />
                Mode RFID aktif — tap kartu satu per satu
              </div>
              <button
                onClick={handleCloseSession}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 text-white px-3 py-2 text-xs font-medium hover:bg-amber-600"
              >
                <Lock size={14} />
                Tutup Sesi
              </button>
            </div>
          </>
        )}
      </div>

      {/* Scan Logs */}
      <div className="bg-white rounded-2xl border border-tp-border">
        <div className="p-4 border-b border-tp-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-tp-text">
            Log Scan ({scanLogs.length})
          </h3>
          {scanLogs.length > 0 && (
            <button
              onClick={() => setScanLogs([])}
              className="text-[10px] text-tp-green font-medium hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {scanLogs.length === 0 ? (
          <div className="text-center py-10 text-tp-muted text-xs">
            <QrCode size={28} className="mx-auto mb-2 opacity-40" />
            <p>Belum ada aktivitas scan.</p>
          </div>
        ) : (
          <div className="divide-y divide-tp-border max-h-[400px] overflow-y-auto">
            {scanLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 flex items-center gap-3 ${
                  log.status === 'success'
                    ? 'bg-emerald-50/50'
                    : log.status === 'duplicate'
                    ? 'bg-amber-50/50'
                    : 'bg-red-50/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    log.status === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : log.status === 'duplicate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {log.status === 'success' ? (
                    <CheckCircle size={16} />
                  ) : log.status === 'duplicate' ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-tp-text truncate">
                      {log.student_name}
                    </p>
                    {log.source === 'rfid' && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5">
                        <CreditCard size={8} /> RFID
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-tp-muted truncate">
                    {log.message}
                    {log.student_class && ` • ${log.student_class}`}
                  </p>
                </div>
                <span className="text-[10px] text-tp-muted font-mono shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}