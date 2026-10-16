import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Monitor, Plus, Trash2, ExternalLink, RefreshCw, X, Copy, Loader2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface Device {
  id: string
  device_name: string
  device_code: string
  device_type: string
  location_note: string
  default_session_mode: string
  is_active: boolean
  last_ping_at: string | null
  created_at: string
}

export default function DeviceManagementPage() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL as string
  const APP_ORIGIN = window.location.origin

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return
      const res = await axios.get(`${API_URL}/api/school-admin/attendance/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDevices(res.data.devices || [])
    } catch (err) {
      console.error('[Devices] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus device "${name}"?`)) return
    try {
      const token = await getAuthToken()
      await axios.delete(`${API_URL}/api/school-admin/attendance/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchDevices()
    } catch (err) {
      alert('Gagal menghapus device')
    }
  }

  const copyKioskUrl = (code: string) => {
    const url = `${APP_ORIGIN}/kiosk/${code}`
    navigator.clipboard.writeText(url)
    alert(`URL kiosk disalin:\n${url}`)
  }

  const formatLastPing = (iso: string | null) => {
    if (!iso) return 'Belum pernah'
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return `${diff} detik lalu`
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Device & Kiosk</h1>
          <p className="text-xs text-tp-muted">
            Kelola device kiosk absensi untuk scanning RFID
          </p>
        </div>
        <button
          onClick={() => navigate('/school-admin/dashboard/attendance')}
          className="text-xs text-tp-muted hover:text-tp-text"
        >
          ← Kembali
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={14} />
          Tambah Device
        </button>
        <button
          onClick={fetchDevices}
          className="inline-flex items-center gap-2 text-xs text-tp-muted hover:text-tp-text"
        >
          <RefreshCw size={14} />
          Muat Ulang
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-tp-border bg-white p-16 text-center">
          <Loader2 size={24} className="mx-auto mb-2 animate-spin text-tp-muted" />
          <p className="text-xs text-tp-muted">Memuat device...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-2xl border border-tp-border bg-white p-16 text-center">
          <Monitor size={32} className="mx-auto mb-3 opacity-40 text-tp-muted" />
          <p className="text-sm font-bold text-tp-text mb-1">Belum Ada Device</p>
          <p className="text-xs text-tp-muted mb-4">
            Tambah device untuk memulai mode kiosk
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus size={14} />
            Tambah Device Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-tp-border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Monitor size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-tp-text">{d.device_name}</p>
                    <p className="text-[11px] text-tp-muted mt-0.5">
                      {d.location_note || 'Tanpa lokasi'} ·{' '}
                      Mode: {d.default_session_mode === 'auto_shift' ? 'Auto-Shift' : 'Manual'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {d.device_code}
                      </span>
                      <span className="text-[10px] text-tp-muted">
                        Last ping: {formatLastPing(d.last_ping_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyKioskUrl(d.device_code)}
                    className="p-2 rounded-lg text-tp-muted hover:bg-gray-50"
                    title="Copy URL kiosk"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => window.open(`/kiosk/${d.device_code}`, '_blank')}
                    className="p-2 rounded-lg text-tp-green hover:bg-emerald-50"
                    title="Buka kiosk"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id, d.device_name)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                    title="Hapus device"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateDeviceModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchDevices()
          }}
        />
      )}
    </div>
  )
}

function CreateDeviceModal({
  onClose, onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const API_URL = import.meta.env.VITE_API_URL as string
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [sessionMode, setSessionMode] = useState('auto_shift')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!name.trim()) { setError('Nama device wajib diisi'); return }
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.post(
        `${API_URL}/api/school-admin/attendance/devices`,
        {
          device_name: name.trim(),
          location_note: location.trim(),
          device_type: 'kiosk',
          default_session_mode: sessionMode,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      )
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal membuat device')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-tp-border">
          <h3 className="text-sm font-bold text-tp-text">Tambah Device Kiosk</h3>
          <button onClick={onClose} className="text-tp-muted hover:text-tp-text">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-tp-muted">Nama Device</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Gerbang Depan"
              className="mt-1 w-full text-xs border border-tp-border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-tp-muted">Lokasi (opsional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Gerbang Utama"
              className="mt-1 w-full text-xs border border-tp-border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-tp-muted">Mode Sesi</label>
            <select
              value={sessionMode}
              onChange={(e) => setSessionMode(e.target.value)}
              className="mt-1 w-full text-xs border border-tp-border rounded-xl px-3 py-2"
            >
              <option value="auto_shift">Auto-Shift (pilih sesi otomatis)</option>
              <option value="manual">Manual (pilih sesi dari URL)</option>
            </select>
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-tp-border">
          <button
            onClick={onClose}
            className="rounded-xl border border-tp-border px-4 py-2 text-xs font-semibold text-tp-muted hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Buat Device'}
          </button>
        </div>
      </div>
    </div>
  )
}