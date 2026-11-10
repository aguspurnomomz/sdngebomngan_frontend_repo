import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react'

interface ActiveSession {
  id: string
  title: string
  shift_name: string
  class_name: string
  status: string
  total_students: number
  total_check_in: number
}

export default function KioskScannerPage() {
  const { code } = useParams<{ code: string }>()
  const API_URL = import.meta.env.VITE_API_URL as string

  const [session, setSession] = useState<ActiveSession | null>(null)
  const [deviceLabel, setDeviceLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean
    name: string
    message: string
    status: 'success' | 'error' | 'duplicate'
  } | null>(null)

  const rfidInputRef = useRef<HTMLInputElement>(null)
  const processingRef = useRef(false)

  // 1. Ambil Sesi Aktif dari Backend berdasarkan Device Code
  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/kiosk/${code}/active-session`)
      if (res.data?.available) {
        setSession(res.data.session)
        setDeviceLabel(res.data.device_label || '')
        setError('')
      } else {
        setSession(null)
        setError(res.data?.error || 'Tidak ada sesi absensi aktif saat ini.')
      }
    } catch (err: any) {
      setSession(null)
      setError(err.response?.data?.error || 'Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }, [API_URL, code])

  // Polling sesi setiap 30 detik (jika sesi berubah/tutup)
  useEffect(() => {
    fetchActiveSession()
    const interval = setInterval(fetchActiveSession, 30000)
    return () => clearInterval(interval)
  }, [fetchActiveSession])

  // Selalu fokuskan input tersembunyi untuk menangkap RFID reader
  useEffect(() => {
    const focus = () => rfidInputRef.current?.focus()
    focus()
    const interval = setInterval(focus, 1000)
    return () => clearInterval(interval)
  }, [])

  // 2. Handle Tap RFID
  const handleRfidScan = async (uid: string) => {
    if (!uid || !session || processingRef.current) return

    processingRef.current = true
    setIsProcessing(true)
    setLastScanResult(null)

    try {
      const res = await axios.post(`${API_URL}/api/kiosk/${code}/scan-rfid`, {
        session_id: session.id,
        rfid_uid: uid.trim().toUpperCase(),
      })

      const data = res.data

      if (data.success) {
        setLastScanResult({
          success: true,
          name: data.student?.full_name || 'Siswa',
          message: `${data.mode === 'check_out' ? 'Pulang' : 'Datang'} - ${data.status}`,
          status: 'success',
        })
        // Refresh data sesi agar angka hadir terupdate
        fetchActiveSession()
      }
    } catch (err: any) {
      const data = err.response?.data || {}
      const isDuplicate = data.code === 'duplicate'
      
      setLastScanResult({
        success: false,
        name: data.student?.full_name || 'Kartu Tidak Dikenal',
        message: data.error || 'Gagal memproses scan',
        status: isDuplicate ? 'duplicate' : 'error',
      })
    } finally {
      processingRef.current = false
      setIsProcessing(false)
      
      // Reset layar setelah 3 detik
      setTimeout(() => setLastScanResult(null), 3000)

      // Bersihkan dan fokuskan input
      if (rfidInputRef.current) {
        rfidInputRef.current.value = ''
        rfidInputRef.current.focus()
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-3" size={32} />
        <span className="text-xl">Menghubungkan ke Server...</span>
      </div>
    )
  }

  // Jika tidak ada sesi aktif
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <WifiOff size={80} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Tidak Ada Sesi Aktif</h1>
        <p className="text-slate-400 mb-8 max-w-md">{error}</p>
        <p className="text-sm text-slate-500">Device: {code}</p>
        <button
          onClick={fetchActiveSession}
          className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-lg"
        >
          Muat Ulang
        </button>
      </div>
    )
  }

  // Jika ada sesi aktif (Layar Kiosk Utama)
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-white overflow-hidden relative">
      
      {/* Header Info */}
      <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Wifi className="text-emerald-400" size={20} />
            <span className="text-emerald-400 font-bold uppercase tracking-widest text-sm">
              Sistem Absensi Aktif
            </span>
          </div>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {session.shift_name} • {session.class_name || 'Semua Kelas'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-emerald-400">
            {session.total_check_in}
            <span className="text-xl text-slate-500 font-normal"> / {session.total_students}</span>
          </div>
          <p className="text-slate-400 text-sm uppercase tracking-wider">Siswa Hadir</p>
        </div>
      </div>

      {/* Area Tengah (Tap Kartu) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {isProcessing ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 size={120} className="text-blue-400 animate-spin mb-8" />
            <h2 className="text-4xl font-bold text-blue-400">Memproses...</h2>
          </div>
        ) : (
          <>
            <div className="w-48 h-48 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 opacity-20 animate-ping" />
              <CreditCard size={80} className="text-slate-500" />
            </div>
            <h2 className="text-5xl font-black tracking-tight text-white mb-4 text-center">
              TAP KARTU ANDA
            </h2>
            <p className="text-xl text-slate-400">
              Tempelkan kartu RFID ke alat pembaca
            </p>
          </>
        )}

        {/* Input Tersembunyi untuk menangkap RFID Reader */}
        <input
          ref={rfidInputRef}
          type="text"
          className="opacity-0 absolute pointer-events-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleRfidScan(e.currentTarget.value)
            }
          }}
        />
      </div>

      {/* Overlay Hasil Scan (Muncul menutupi layar) */}
      {lastScanResult && (
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ${
            lastScanResult.status === 'success'
              ? 'bg-emerald-600'
              : lastScanResult.status === 'duplicate'
              ? 'bg-amber-500'
              : 'bg-red-600'
          }`}
        >
          {lastScanResult.status === 'success' && (
            <CheckCircle size={160} className="text-white mb-8" />
          )}
          {lastScanResult.status === 'duplicate' && (
            <AlertTriangle size={160} className="text-white mb-8" />
          )}
          {lastScanResult.status === 'error' && (
            <XCircle size={160} className="text-white mb-8" />
          )}

          <h2 className="text-6xl font-black text-white mb-4">
            {lastScanResult.name}
          </h2>
          <p className="text-3xl font-semibold text-white/90">
            {lastScanResult.message}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900 p-4 text-center border-t border-slate-800 text-slate-500 text-sm">
        Device: <span className="font-mono">{code}</span> | {deviceLabel}
      </div>
    </div>
  )
}