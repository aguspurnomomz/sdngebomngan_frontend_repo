import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Plus, Trash2, RefreshCw, Search, X, CheckCircle2,
  AlertCircle, Loader2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface StudentRow {
  student_id: string
  full_name: string
  nisn: string
  student_number: string
  sub_class_name: string
  class_name: string
  class_level: string
  card_id: string | null
  rfid_uid: string | null
  card_label: string
  is_active: boolean | null
  registered_at: string | null
  last_used_at: string | null
}

interface SubClass {
  id: string
  name: string
  class_group_name: string
  class_group_level: string
}

export default function RfidCardManagementPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [subClasses, setSubClasses] = useState<SubClass[]>([])
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    total_students: 0, with_card: 0, without_card: 0, active_cards: 0,
  })

  const [filterSubClass, setFilterSubClass] = useState('')
  const [filterHasCard, setFilterHasCard] = useState('')
  const [search, setSearch] = useState('')
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return
      const headers = { Authorization: `Bearer ${token}` }

      const params = new URLSearchParams()
      if (filterSubClass) params.append('sub_class_id', filterSubClass)
      if (filterHasCard) params.append('has_card', filterHasCard)
      if (search) params.append('search', search)

      const [cardsRes, subClassesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/school-admin/rfid-cards?${params}`, { headers }),
        axios.get(`${API_URL}/api/school-admin/sub-classes`, { headers }),
      ])

      if (cardsRes.status === 'fulfilled') {
        setStudents(cardsRes.value.data.students || [])
        setStats({
          total_students: cardsRes.value.data.total_students || 0,
          with_card: cardsRes.value.data.with_card || 0,
          without_card: cardsRes.value.data.without_card || 0,
          active_cards: cardsRes.value.data.active_cards || 0,
        })
      }

      if (subClassesRes.status === 'fulfilled') {
        setSubClasses(subClassesRes.value.data.sub_classes || [])
      }
    } catch (err) {
      console.error('[RFID] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [API_URL, filterSubClass, filterHasCard, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteCard = async (cardId: string, studentName: string) => {
    if (!confirm(`Nonaktifkan kartu RFID milik ${studentName}?`)) return
    try {
      const token = await getAuthToken()
      await axios.delete(`${API_URL}/api/school-admin/rfid-cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (err) {
      alert('Gagal menonaktifkan kartu')
    }
  }

  const handleRevokeCard = async (cardId: string, studentName: string) => {
    if (!confirm(`CABUT PERMANEN kartu RFID milik ${studentName}?\n\nUID akan bisa dipakai ulang. Ini untuk kasus kartu hilang/rusak.`)) return
    try {
      const token = await getAuthToken()
      await axios.post(`${API_URL}/api/school-admin/rfid-cards/${cardId}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (err) {
      alert('Gagal mencabut kartu')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Manajemen Kartu RFID</h1>
          <p className="text-xs text-tp-muted">
            Daftarkan kartu RFID ke siswa untuk absensi tap-card
          </p>
        </div>
        <button
          onClick={() => navigate('/school-admin/dashboard/attendance')}
          className="text-xs text-tp-muted hover:text-tp-text"
        >
          ← Kembali
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Siswa" value={stats.total_students} color="blue" />
        <StatCard label="Sudah Punya Kartu" value={stats.with_card} color="emerald" />
        <StatCard label="Belum Punya Kartu" value={stats.without_card} color="amber" />
        <StatCard label="Kartu Aktif" value={stats.active_cards} color="indigo" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-tp-border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-muted" />
            <input
              type="text"
              placeholder="Cari nama / NISN / UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-tp-border rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-green/30"
            />
          </div>
          <select
            value={filterSubClass}
            onChange={(e) => setFilterSubClass(e.target.value)}
            className="text-xs border border-tp-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tp-green/30"
          >
            <option value="">Semua Kelas</option>
            {subClasses.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.class_group_level} {sc.class_group_name} - {sc.name}
              </option>
            ))}
          </select>
          <select
            value={filterHasCard}
            onChange={(e) => setFilterHasCard(e.target.value)}
            className="text-xs border border-tp-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tp-green/30"
          >
            <option value="">Semua Status</option>
            <option value="yes">Sudah Punya Kartu</option>
            <option value="no">Belum Punya Kartu</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            <Plus size={14} />
            Daftarkan Kartu
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-tp-border bg-white px-4 py-2 text-xs font-semibold text-tp-text hover:bg-gray-50"
          >
            <CreditCard size={14} />
            Mode Bulk
          </button>
          <button
            onClick={fetchData}
            className="ml-auto inline-flex items-center gap-2 text-xs text-tp-muted hover:text-tp-text"
          >
            <RefreshCw size={14} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-tp-border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-tp-muted">
            <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
            Memuat data...
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-tp-muted">
            <CreditCard size={32} className="mx-auto mb-3 opacity-40" />
            <p>Belum ada data siswa.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-tp-border">
              <tr className="text-left text-tp-muted">
                <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                <th className="px-4 py-3 font-semibold">NISN</th>
                <th className="px-4 py-3 font-semibold">Kelas</th>
                <th className="px-4 py-3 font-semibold">UID Kartu</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border">
              {students.map((s) => (
                <tr key={s.student_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-tp-text">{s.full_name}</td>
                  <td className="px-4 py-3 text-tp-muted font-mono">{s.nisn || '-'}</td>
                  <td className="px-4 py-3 text-tp-muted">
                    {s.class_level} {s.class_name} — {s.sub_class_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-tp-text">
                    {s.rfid_uid || <span className="text-tp-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.card_id && s.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={10} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                        <AlertCircle size={10} /> Belum
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.card_id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDeleteCard(s.card_id!, s.full_name)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                          title="Nonaktifkan kartu"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => handleRevokeCard(s.card_id!, s.full_name)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                          title="Cabut permanen (kartu hilang)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRegisterModal(true)}
                        className="text-[10px] font-bold text-tp-green hover:underline"
                      >
                        + Daftarkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRegisterModal && (
        <RegisterRfidModal
          students={students.filter((s) => !s.card_id)}
          subClasses={subClasses}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false)
            fetchData()
          }}
        />
      )}

      {showBulkModal && (
        <BulkRegisterModal
          subClasses={subClasses}
          onClose={() => setShowBulkModal(false)}
          onFinish={() => {
            setShowBulkModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }
  return (
    <div className="rounded-2xl border border-tp-border bg-white p-5 shadow-sm">
      <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
        {label}
      </p>
      <p className={`mt-2 inline-block px-3 py-1 rounded-lg text-2xl font-bold ${colorMap[color]}`}>
        {value}
      </p>
    </div>
  )
}


function RegisterRfidModal({
  students, subClasses, onClose, onSuccess,
}: {
  students: StudentRow[]
  subClasses: SubClass[]
  onClose: () => void
  onSuccess: () => void
}) {
  const API_URL = import.meta.env.VITE_API_URL as string
  const [selectedStudent, setSelectedStudent] = useState('')
  const [uid, setUid] = useState('')
  const [cardLabel, setCardLabel] = useState('')
  const [filterSub, setFilterSub] = useState('')
  const [mode, setMode] = useState<'reader' | 'manual'>('reader')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'reader') {
      const interval = setInterval(() => inputRef.current?.focus(), 1500)
      inputRef.current?.focus()
      return () => clearInterval(interval)
    }
  }, [mode])

  const filteredStudents = filterSub
    ? students.filter((s) => s.sub_class_name && s.class_name)
    : students

  const handleSubmit = async () => {
    setError(null)
    if (!selectedStudent) { setError('Pilih siswa dulu'); return }
    if (!uid) { setError('UID kartu belum di-scan / diisi'); return }

    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.post(
        `${API_URL}/api/school-admin/rfid-cards`,
        {
          student_id: selectedStudent,
          rfid_uid: uid,
          card_label: cardLabel,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      )
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mendaftarkan kartu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-tp-border">
          <h3 className="text-sm font-bold text-tp-text">Daftarkan Kartu RFID</h3>
          <button onClick={onClose} className="text-tp-muted hover:text-tp-text">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Filter kelas */}
          <div>
            <label className="text-xs font-semibold text-tp-muted">Filter Kelas (opsional)</label>
            <select
              value={filterSub}
              onChange={(e) => setFilterSub(e.target.value)}
              className="mt-1 w-full text-xs border border-tp-border rounded-xl px-3 py-2"
            >
              <option value="">Semua kelas</option>
              {subClasses.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.class_group_level} {sc.class_group_name} - {sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih siswa */}
          <div>
            <label className="text-xs font-semibold text-tp-muted">Pilih Siswa</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="mt-1 w-full text-xs border border-tp-border rounded-xl px-3 py-2"
            >
              <option value="">-- Pilih siswa --</option>
              {filteredStudents.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.full_name} — {s.class_level} {s.class_name} {s.sub_class_name} ({s.nisn})
                </option>
              ))}
            </select>
          </div>

          {/* Mode input */}
          <div>
            <label className="text-xs font-semibold text-tp-muted">Metode Input UID</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setMode('reader')}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl border ${
                  mode === 'reader'
                    ? 'bg-tp-green text-white border-tp-green'
                    : 'bg-white border-tp-border text-tp-muted'
                }`}
              >
                📡 Scan via Reader
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl border ${
                  mode === 'manual'
                    ? 'bg-tp-green text-white border-tp-green'
                    : 'bg-white border-tp-border text-tp-muted'
                }`}
              >
                ⌨️ Ketik Manual
              </button>
            </div>
          </div>

          {/* Input UID */}
          <div>
            <label className="text-xs font-semibold text-tp-muted">UID Kartu</label>
            {mode === 'reader' ? (
              <div className="mt-1 border-2 border-dashed border-indigo-300 rounded-xl py-6 text-center bg-indigo-50/30">
                <CreditCard size={32} className="mx-auto mb-2 text-indigo-500" />
                <p className="text-sm font-bold text-indigo-700">
                  {uid ? `✅ ${uid}` : '📡 Tap kartu ke reader'}
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  className="opacity-0 absolute pointer-events-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setUid(e.currentTarget.value.trim().toUpperCase())
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            ) : (
              <input
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value.toUpperCase())}
                placeholder="Contoh: A1B2C3D4"
                className="mt-1 w-full text-xs font-mono border border-tp-border rounded-xl px-3 py-2"
              />
            )}
          </div>

          {/* Card label */}
          <div>
            <label className="text-xs font-semibold text-tp-muted">Label Kartu (opsional)</label>
            <input
              type="text"
              value={cardLabel}
              onChange={(e) => setCardLabel(e.target.value)}
              placeholder="Contoh: Kartu OSIS 2026"
              className="mt-1 w-full text-xs border border-tp-border rounded-xl px-3 py-2"
            />
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
            {saving ? 'Menyimpan...' : 'Daftarkan'}
          </button>
        </div>
      </div>
    </div>
  )
}


function BulkRegisterModal({
  subClasses, onClose, onFinish,
}: {
  subClasses: SubClass[]
  onClose: () => void
  onFinish: () => void
}) {
  const API_URL = import.meta.env.VITE_API_URL as string
  const [selectedSubClass, setSelectedSubClass] = useState('')
  const [log, setLog] = useState<{ uid: string; name: string; ok: boolean; msg: string }[]>([])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => inputRef.current?.focus(), 1500)
    inputRef.current?.focus()
    return () => clearInterval(interval)
  }, [])

  const handleTap = async (uid: string) => {
    if (!selectedSubClass) {
      alert('Pilih kelas dulu')
      return
    }
    if (!uid) return
    setBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.post(
        `${API_URL}/api/school-admin/rfid-cards/bulk-register`,
        { class_sub_group_id: selectedSubClass, rfid_uid: uid },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      )
      setLog((prev) => [
        { uid, name: res.data.student_name, ok: true, msg: 'OK' },
        ...prev,
      ])
    } catch (err: any) {
      setLog((prev) => [
        {
          uid,
          name: err.response?.data?.student_name || '-',
          ok: false,
          msg: err.response?.data?.error || 'Gagal',
        },
        ...prev,
      ])
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
      inputRef.current?.focus()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-tp-border">
          <h3 className="text-sm font-bold text-tp-text">Mode Bulk Registration</h3>
          <button onClick={onClose} className="text-tp-muted hover:text-tp-text">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-auto">
          <div>
            <label className="text-xs font-semibold text-tp-muted">Kelas Target</label>
            <select
              value={selectedSubClass}
              onChange={(e) => setSelectedSubClass(e.target.value)}
              className="mt-1 w-full text-xs border border-tp-border rounded-xl px-3 py-2"
            >
              <option value="">-- Pilih kelas --</option>
              {subClasses.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.class_group_level} {sc.class_group_name} - {sc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-indigo-300 rounded-xl py-8 text-center bg-indigo-50/30">
            <CreditCard size={48} className="mx-auto mb-2 text-indigo-500" />
            <p className="text-sm font-bold text-indigo-700">
              📡 Tap kartu satu per satu
            </p>
            <p className="text-[11px] text-tp-muted mt-1">
              Sistem otomatis assign ke siswa berikutnya yang belum punya kartu
            </p>
            {busy && (
              <Loader2 size={16} className="mx-auto mt-3 animate-spin text-indigo-500" />
            )}
            <input
              ref={inputRef}
              type="text"
              className="opacity-0 absolute pointer-events-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleTap(e.currentTarget.value.trim().toUpperCase())
                }
              }}
            />
          </div>

          {log.length > 0 && (
            <div className="rounded-xl border border-tp-border bg-gray-50 max-h-60 overflow-auto">
              {log.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-tp-border last:border-0 ${
                    item.ok ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {item.ok ? '✅' : '❌'}
                  <span className="font-mono text-tp-muted">{item.uid}</span>
                  <span className="font-semibold">{item.name}</span>
                  <span className="ml-auto text-[10px]">{item.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-5 border-t border-tp-border">
          <p className="text-xs text-tp-muted">
            Berhasil: {log.filter((l) => l.ok).length} / {log.length}
          </p>
          <button
            onClick={onFinish}
            className="rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}