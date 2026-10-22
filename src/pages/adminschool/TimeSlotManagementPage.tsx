import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'
import {
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Wand2,
  Coffee,
  X,
  Pencil,
  CalendarClock,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

type TimeSlot = {
  id: string
  period_number: number
  start_time: string
  end_time: string
  is_break: boolean
}

type TimeSlotOverride = {
  id: string
  day_of_week: number // 1=Senin..7=Minggu
  period_number: number
  start_time: string
  end_time: string
  is_break: boolean
  notes?: string
}

const DAY_LABELS: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
}

// const DAY_SHORT: Record<number, string> = {
//   1: 'Sen',
//   2: 'Sel',
//   3: 'Rab',
//   4: 'Kam',
//   5: 'Jum',
//   6: 'Sab',
//   7: 'Min',
// }

export default function TimeSlotManagementPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal State: Manual Create/Edit
  const [showModal, setShowModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [form, setForm] = useState({
    period_number: 1,
    start_time: '07:00',
    end_time: '07:35',
    is_break: false,
  })
  const [saving, setSaving] = useState(false)

  // Modal State: Auto Generate
  const [showGenerate, setShowGenerate] = useState(false)
  const [genForm, setGenForm] = useState({
    start_time: '07:00',
    jp_duration: 35, // menit
    total_jp: 8,
    break_after_jp: 4,
    break_duration: 30, // menit
  })
  const [generating, setGenerating] = useState(false)

  // Override State
  const [overrides, setOverrides] = useState<TimeSlotOverride[]>([])
  const [loadingOverrides, setLoadingOverrides] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [editingOverride, setEditingOverride] = useState<TimeSlotOverride | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    day_of_week: 5,
    period_number: 1,
    start_time: '',
    end_time: '',
    is_break: false,
    notes: '',
  })
  const [savingOverride, setSavingOverride] = useState(false)

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<TimeSlot | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteOverrideTarget, setDeleteOverrideTarget] = useState<TimeSlotOverride | null>(null)
  const [deletingOverride, setDeletingOverride] = useState(false)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await axios.get(`${API_URL}/api/school-admin/time-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTimeSlots(res.data.time_slots || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data jam')
    } finally {
      setLoading(false)
    }
  }

  const fetchOverrides = async () => {
    setLoadingOverrides(true)
    try {
      const token = await getToken()
      const res = await axios.get(`${API_URL}/api/school-admin/time-slot-overrides`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOverrides(res.data.overrides || [])
    } catch (err: any) {
      // non-fatal — override opsional, jangan block UI
      console.error('Gagal memuat override:', err?.response?.data?.error || err.message)
    } finally {
      setLoadingOverrides(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchOverrides()
  }, [])

  // ==========================================
  // DEFAULT SLOTS — CREATE / EDIT / DELETE
  // ==========================================
  const openCreateManual = () => {
    const nextNum = timeSlots.length > 0 ? Math.max(...timeSlots.map((s) => s.period_number)) + 1 : 1
    setEditingSlot(null)
    setForm({ period_number: nextNum, start_time: '', end_time: '', is_break: false })
    setShowModal(true)
  }

  const openEdit = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setForm({
      period_number: slot.period_number,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_break: slot.is_break,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.start_time || !form.end_time) {
      alert('Jam mulai dan selesai wajib diisi')
      return
    }
    if (form.end_time <= form.start_time) {
      alert('Jam selesai harus lebih besar dari jam mulai')
      return
    }
    setSaving(true)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      if (editingSlot) {
        await axios.put(`${API_URL}/api/school-admin/time-slots/${editingSlot.id}`, form, { headers })
      } else {
        await axios.post(`${API_URL}/api/school-admin/time-slots`, form, { headers })
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan jam')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const token = await getToken()
      await axios.delete(`${API_URL}/api/school-admin/time-slots/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeleteTarget(null)
      fetchData()
      // Override yang period_number-nya terkait mungkin jadi invalid
      fetchOverrides()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  // ==========================================
  // AUTO GENERATE
  // ==========================================
  const handleAutoGenerate = async () => {
    if (timeSlots.length > 0) {
      if (!confirm('Generate otomatis akan MENGHAPUS semua jadwal jam default yang sudah ada. Lanjutkan?')) return
    }
    setGenerating(true)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      // Hapus yang lama dulu (jika ada)
      for (const slot of timeSlots) {
        await axios.delete(`${API_URL}/api/school-admin/time-slots/${slot.id}`, { headers })
      }

      // Generate baru
      let currentTime = new Date(`1970-01-01T${genForm.start_time}:00`)
      let currentPeriod = 1

      for (let i = 1; i <= genForm.total_jp; i++) {
        const start = currentTime.toTimeString().slice(0, 5)
        currentTime.setMinutes(currentTime.getMinutes() + genForm.jp_duration)
        const end = currentTime.toTimeString().slice(0, 5)

        await axios.post(
          `${API_URL}/api/school-admin/time-slots`,
          { period_number: currentPeriod, start_time: start, end_time: end, is_break: false },
          { headers },
        )

        currentPeriod++

        if (i === genForm.break_after_jp) {
          const bStart = currentTime.toTimeString().slice(0, 5)
          currentTime.setMinutes(currentTime.getMinutes() + genForm.break_duration)
          const bEnd = currentTime.toTimeString().slice(0, 5)

          await axios.post(
            `${API_URL}/api/school-admin/time-slots`,
            { period_number: currentPeriod, start_time: bStart, end_time: bEnd, is_break: true },
            { headers },
          )

          currentPeriod++
        }
      }

      setShowGenerate(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal generate otomatis')
    } finally {
      setGenerating(false)
    }
  }

  // ==========================================
  // OVERRIDES — CREATE / EDIT / DELETE
  // ==========================================
  const openCreateOverride = () => {
    const firstSlot = timeSlots[0]
    setEditingOverride(null)
    setOverrideForm({
      day_of_week: 5, // default Jumat
      period_number: firstSlot?.period_number ?? 1,
      start_time: firstSlot?.start_time ?? '',
      end_time: firstSlot?.end_time ?? '',
      is_break: firstSlot?.is_break ?? false,
      notes: '',
    })
    setShowOverrideModal(true)
  }

  const openEditOverride = (o: TimeSlotOverride) => {
    setEditingOverride(o)
    setOverrideForm({
      day_of_week: o.day_of_week,
      period_number: o.period_number,
      start_time: o.start_time,
      end_time: o.end_time,
      is_break: o.is_break,
      notes: o.notes ?? '',
    })
    setShowOverrideModal(true)
  }

  // Saat user ganti JP di modal override → auto-fill jam dari default
  const handleOverridePeriodChange = (periodNumber: number) => {
    const def = timeSlots.find((s) => s.period_number === periodNumber)
    setOverrideForm((prev) => ({
      ...prev,
      period_number: periodNumber,
      start_time: def?.start_time ?? prev.start_time,
      end_time: def?.end_time ?? prev.end_time,
      is_break: def?.is_break ?? prev.is_break,
    }))
  }

  const handleSaveOverride = async () => {
    if (!overrideForm.start_time || !overrideForm.end_time) {
      alert('Jam mulai dan selesai wajib diisi')
      return
    }
    if (overrideForm.end_time <= overrideForm.start_time) {
      alert('Jam selesai harus lebih besar dari jam mulai')
      return
    }

    // Cek duplikat lokal (kecuali dirinya sendiri saat edit)
    const duplicate = overrides.find(
      (o) =>
        o.day_of_week === overrideForm.day_of_week &&
        o.period_number === overrideForm.period_number &&
        o.id !== editingOverride?.id,
    )
    if (duplicate) {
      alert(
        `Override untuk ${DAY_LABELS[overrideForm.day_of_week]} JP ${overrideForm.period_number} sudah ada. ` +
          `Edit yang sudah ada atau hapus dulu.`,
      )
      return
    }

    setSavingOverride(true)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      if (editingOverride) {
        await axios.put(
          `${API_URL}/api/school-admin/time-slot-overrides/${editingOverride.id}`,
          overrideForm,
          { headers },
        )
      } else {
        await axios.post(`${API_URL}/api/school-admin/time-slot-overrides`, overrideForm, { headers })
      }

      setShowOverrideModal(false)
      fetchOverrides()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan override')
    } finally {
      setSavingOverride(false)
    }
  }

  const handleDeleteOverride = async () => {
    if (!deleteOverrideTarget) return
    setDeletingOverride(true)
    try {
      const token = await getToken()
      await axios.delete(
        `${API_URL}/api/school-admin/time-slot-overrides/${deleteOverrideTarget.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setDeleteOverrideTarget(null)
      fetchOverrides()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus override')
    } finally {
      setDeletingOverride(false)
    }
  }

  // Group overrides per hari untuk tampilan
  const overridesByDay = useMemo(() => {
    const map: Record<number, TimeSlotOverride[]> = {}
    for (const o of overrides) {
      if (!map[o.day_of_week]) map[o.day_of_week] = []
      map[o.day_of_week].push(o)
    }
    for (const day of Object.keys(map)) {
      map[Number(day)].sort((a, b) => a.period_number - b.period_number)
    }
    return map
  }, [overrides])

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="animate-spin inline text-tp-green" size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-tp-text sm:text-2xl">
            <Clock size={24} className="text-tp-green" />
            Pengaturan Jam Pelajaran
          </h1>
          <p className="mt-1 text-sm text-tp-muted">
            Tentukan durasi setiap Jam Pelajaran (JP) agar tampil di jadwal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreateOverride}
            disabled={timeSlots.length === 0}
            title={timeSlots.length === 0 ? 'Buat jam default terlebih dahulu' : undefined}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500 bg-white px-4 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarClock size={18} />
            Override per Hari
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-tp-green bg-white px-4 py-2.5 text-sm font-semibold text-tp-green hover:bg-tp-green/5"
          >
            <Wand2 size={18} />
            Generate Otomatis
          </button>
          <button
            onClick={openCreateManual}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover"
          >
            <Plus size={18} />
            Tambah Manual
          </button>
        </div>
      </div>

      {/* ===================== ERROR ===================== */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================== LIST DEFAULT ===================== */}
      {timeSlots.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-tp-border bg-white p-12 text-center">
          <Clock size={48} className="text-tp-faint" />
          <p className="text-sm font-medium text-tp-text">Belum ada konfigurasi jam</p>
          <p className="text-xs text-tp-muted">
            Gunakan "Generate Otomatis" untuk membuat slot jam dengan cepat.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-bold text-tp-text">Jam Default (Semua Hari)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center justify-between rounded-xl border p-4 shadow-sm ${
                  slot.is_break ? 'border-amber-200 bg-amber-50' : 'border-tp-border bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm ${
                      slot.is_break ? 'bg-amber-200 text-amber-800' : 'bg-tp-green/10 text-tp-green'
                    }`}
                  >
                    {slot.is_break ? <Coffee size={18} /> : `J${slot.period_number}`}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        slot.is_break ? 'text-amber-900' : 'text-tp-text'
                      }`}
                    >
                      {slot.start_time} - {slot.end_time}
                    </p>
                    <p className="text-[11px] text-tp-muted">
                      {slot.is_break ? 'Waktu Istirahat' : `Jam Pelajaran ke-${slot.period_number}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(slot)}
                    className="p-2 text-tp-muted hover:text-tp-green rounded-lg hover:bg-tp-green/10"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(slot)}
                    className="p-2 text-tp-muted hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== LIST OVERRIDE ===================== */}
      {timeSlots.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={18} className="text-amber-600" />
              <h2 className="text-sm font-bold text-amber-900">Override Jam (Hari Khusus)</h2>
              {overrides.length > 0 && (
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {overrides.length}
                </span>
              )}
            </div>
            {loadingOverrides && <Loader2 size={14} className="animate-spin text-amber-600" />}
          </div>

          {overrides.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-white/60 p-6 text-center">
              <p className="text-xs text-amber-800">
                Belum ada override. Klik <strong>"Override per Hari"</strong> di atas untuk
                membuat jam khusus (mis. Jumat istirahat lebih awal).
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.keys(overridesByDay)
                .map(Number)
                .sort((a, b) => a - b)
                .map((day) => (
                  <div key={day} className="rounded-xl border border-amber-200 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                        {DAY_LABELS[day]}
                      </span>
                      <span className="text-[11px] text-amber-700">
                        {overridesByDay[day].length} override
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {overridesByDay[day].map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 p-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${
                                o.is_break
                                  ? 'bg-amber-200 text-amber-800'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {o.is_break ? <Coffee size={14} /> : `J${o.period_number}`}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-tp-text">
                                {o.start_time}–{o.end_time}
                              </p>
                              <p className="text-[10px] text-amber-700">
                                {o.is_break
                                  ? 'Istirahat'
                                  : `Override JP ${o.period_number}`}
                                {o.notes ? ` · ${o.notes}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditOverride(o)}
                              className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-100"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteOverrideTarget(o)}
                              className="rounded-lg p-1.5 text-amber-700 hover:bg-rose-50 hover:text-rose-600"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <p className="mt-3 text-[11px] text-amber-700">
            Override akan menimpa jam default untuk hari tersebut saat ditampilkan di jadwal
            pelajaran.
          </p>
        </div>
      )}

      {/* ===================== MODAL MANUAL ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !saving && setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-tp-muted"
            >
              <X size={20} />
            </button>
            <h3 className="mb-4 text-lg font-bold text-tp-text">
              {editingSlot ? 'Edit Jam' : 'Tambah Jam Manual'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">Jam Ke-</label>
                <input
                  type="number"
                  value={form.period_number}
                  onChange={(e) => setForm({ ...form, period_number: parseInt(e.target.value) })}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  disabled={form.is_break}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-tp-text">Mulai</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-tp-text">Selesai</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isBreak"
                  checked={form.is_break}
                  onChange={(e) => setForm({ ...form, is_break: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-tp-green focus:ring-tp-green"
                />
                <label htmlFor="isBreak" className="text-sm text-tp-text flex items-center gap-1">
                  <Coffee size={14} /> Tandai sebagai Waktu Istirahat
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border py-2 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-tp-green py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL AUTO GENERATE ===================== */}
      {showGenerate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !generating && setShowGenerate(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowGenerate(false)}
              className="absolute right-4 top-4 text-tp-muted"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="text-tp-green" size={24} />
              <h3 className="text-lg font-bold text-tp-text">Generate Otomatis</h3>
            </div>

            <p className="text-sm text-tp-muted mb-4">
              Isi detail di bawah, sistem akan menghitung dan membuatkan slot jam secara
              berurutan.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Jam Mulai Sekolah
                </label>
                <input
                  type="time"
                  value={genForm.start_time}
                  onChange={(e) => setGenForm({ ...genForm, start_time: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Durasi 1 JP (Menit)
                </label>
                <input
                  type="number"
                  value={genForm.jp_duration}
                  onChange={(e) =>
                    setGenForm({ ...genForm, jp_duration: parseInt(e.target.value) })
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Total JP per Hari
                </label>
                <input
                  type="number"
                  value={genForm.total_jp}
                  onChange={(e) => setGenForm({ ...genForm, total_jp: parseInt(e.target.value) })}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Istirahat Setelah Jam Ke-
                </label>
                <input
                  type="number"
                  value={genForm.break_after_jp}
                  onChange={(e) =>
                    setGenForm({ ...genForm, break_after_jp: parseInt(e.target.value) })
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Durasi Istirahat (Menit)
                </label>
                <input
                  type="number"
                  value={genForm.break_duration}
                  onChange={(e) =>
                    setGenForm({ ...genForm, break_duration: parseInt(e.target.value) })
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowGenerate(false)}
                className="flex-1 rounded-xl border py-2 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="flex-1 rounded-xl bg-tp-green py-2 text-sm font-semibold text-white flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {generating && <Loader2 size={16} className="animate-spin" />}
                {generating ? 'Memproses...' : 'Generate Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL OVERRIDE ===================== */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !savingOverride && setShowOverrideModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowOverrideModal(false)}
              className="absolute right-4 top-4 text-tp-muted"
            >
              <X size={20} />
            </button>
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock size={20} className="text-amber-600" />
              <h3 className="text-lg font-bold text-tp-text">
                {editingOverride ? 'Edit Override' : 'Override Jam per Hari'}
              </h3>
            </div>

            <p className="mb-4 text-xs text-tp-muted">
              Jam default akan tetap berlaku untuk hari lain. Override hanya menimpa jam pada
              hari yang dipilih.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">Hari</label>
                <select
                  value={overrideForm.day_of_week}
                  onChange={(e) =>
                    setOverrideForm({
                      ...overrideForm,
                      day_of_week: parseInt(e.target.value),
                    })
                  }
                  disabled={!!editingOverride}
                  className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  {Object.entries(DAY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">Jam Ke-</label>
                <select
                  value={overrideForm.period_number}
                  onChange={(e) => handleOverridePeriodChange(parseInt(e.target.value))}
                  disabled={!!editingOverride}
                  className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  {timeSlots.map((s) => (
                    <option key={s.id} value={s.period_number}>
                      JP {s.period_number} {s.is_break ? '(Istirahat)' : ''} — default{' '}
                      {s.start_time}–{s.end_time}
                    </option>
                  ))}
                </select>
                {editingOverride && (
                  <p className="mt-1 text-[10px] text-tp-muted">
                    Hari & JP tidak bisa diubah saat edit. Hapus lalu buat baru jika perlu.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-tp-text">Mulai</label>
                  <input
                    type="time"
                    value={overrideForm.start_time}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, start_time: e.target.value })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-tp-text">Selesai</label>
                  <input
                    type="time"
                    value={overrideForm.end_time}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, end_time: e.target.value })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isBreakOverride"
                  checked={overrideForm.is_break}
                  onChange={(e) =>
                    setOverrideForm({ ...overrideForm, is_break: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isBreakOverride" className="text-sm text-tp-text flex items-center gap-1">
                  <Coffee size={14} /> Tandai sebagai Waktu Istirahat
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={overrideForm.notes}
                  onChange={(e) => setOverrideForm({ ...overrideForm, notes: e.target.value })}
                  placeholder="mis. Jumat pendek, istirahat lebih awal"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="flex-1 rounded-xl border py-2 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveOverride}
                disabled={savingOverride}
                className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingOverride ? 'Menyimpan...' : editingOverride ? 'Simpan Perubahan' : 'Simpan Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL DELETE DEFAULT ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <Trash2 className="mx-auto text-rose-500 mb-3" size={32} />
            <h3 className="mb-2 text-lg font-bold">Hapus Jam?</h3>
            <p className="text-sm text-tp-muted mb-6">
              Jam {deleteTarget.is_break ? 'Istirahat' : `Ke-${deleteTarget.period_number}`} (
              {deleteTarget.start_time} - {deleteTarget.end_time}) akan dihapus.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border py-2 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL DELETE OVERRIDE ===================== */}
      {deleteOverrideTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deletingOverride && setDeleteOverrideTarget(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <Trash2 className="mx-auto text-rose-500 mb-3" size={32} />
            <h3 className="mb-2 text-lg font-bold">Hapus Override?</h3>
            <p className="text-sm text-tp-muted mb-6">
              Override{' '}
              <strong>
                {DAY_LABELS[deleteOverrideTarget.day_of_week]} —{' '}
                {deleteOverrideTarget.is_break
                  ? 'Istirahat'
                  : `JP ${deleteOverrideTarget.period_number}`}
              </strong>{' '}
              ({deleteOverrideTarget.start_time}–{deleteOverrideTarget.end_time}) akan dihapus. Jam
              default akan berlaku kembali untuk hari tersebut.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOverrideTarget(null)}
                className="flex-1 rounded-xl border py-2 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteOverride}
                disabled={deletingOverride}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deletingOverride ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}