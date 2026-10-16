import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../components/ui/button'
import {
  Plus,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  Clock,
  Pencil,
  Star,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface Shift {
  id: string
  name: string
  code: string
  description: string
  shift_category: string
  check_in_start: string
  check_in_on_time_start: string
  check_in_on_time_end: string
  check_in_end: string
  require_check_out: boolean
  check_out_start: string | null
  check_out_on_time_start: string | null
  check_out_on_time_end: string | null
  check_out_end: string | null
  is_active: boolean
  is_default: boolean
  applicable_days: number[]
}

const CATEGORY_OPTIONS = [
  { value: 'regular', label: 'Reguler' },
  { value: 'exam', label: 'Ujian' },
  { value: 'event', label: 'Event' },
  { value: 'extracurricular', label: 'Ekstrakurikuler' },
]

const DAY_OPTIONS = [
  { value: 1, label: 'Sen' },
  { value: 2, label: 'Sel' },
  { value: 3, label: 'Rab' },
  { value: 4, label: 'Kam' },
  { value: 5, label: 'Jum' },
  { value: 6, label: 'Sab' },
  { value: 7, label: 'Min' },
]

export default function ShiftManagementPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('regular')
  const [formCheckInStart, setFormCheckInStart] = useState('05:30')
  const [formCheckInOnTimeStart, setFormCheckInOnTimeStart] = useState('06:15')
  const [formCheckInOnTimeEnd, setFormCheckInOnTimeEnd] = useState('06:45')
  const [formCheckInEnd, setFormCheckInEnd] = useState('07:00')
  const [formRequireCheckOut, setFormRequireCheckOut] = useState(true)
  const [formCheckOutStart, setFormCheckOutStart] = useState('12:00')
  const [formCheckOutOnTimeStart, setFormCheckOutOnTimeStart] = useState('12:30')
  const [formCheckOutOnTimeEnd, setFormCheckOutOnTimeEnd] = useState('13:30')
  const [formCheckOutEnd, setFormCheckOutEnd] = useState('14:00')
  const [formApplicableDays, setFormApplicableDays] = useState<number[]>([1, 2, 3, 4, 5, 6])
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await axios.get(
        `${API_URL}/api/school-admin/attendance/shifts`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShifts(res.data?.shifts ?? [])
    } catch (error: any) {
      console.error('Gagal fetch shifts:', error)
      setErrorMessage(error.response?.data?.error || 'Gagal memuat shift')
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  const resetForm = () => {
    setEditingShift(null)
    setFormName('')
    setFormCode('')
    setFormDescription('')
    setFormCategory('regular')
    setFormCheckInStart('05:30')
    setFormCheckInOnTimeStart('06:15')
    setFormCheckInOnTimeEnd('06:45')
    setFormCheckInEnd('07:00')
    setFormRequireCheckOut(true)
    setFormCheckOutStart('12:00')
    setFormCheckOutOnTimeStart('12:30')
    setFormCheckOutOnTimeEnd('13:30')
    setFormCheckOutEnd('14:00')
    setFormApplicableDays([1, 2, 3, 4, 5, 6])
    setFormError('')
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift)
    setFormName(shift.name)
    setFormCode(shift.code)
    setFormDescription(shift.description || '')
    setFormCategory(shift.shift_category)
    setFormCheckInStart(shift.check_in_start)
    setFormCheckInOnTimeStart(shift.check_in_on_time_start)
    setFormCheckInOnTimeEnd(shift.check_in_on_time_end)
    setFormCheckInEnd(shift.check_in_end)
    setFormRequireCheckOut(shift.require_check_out)
    setFormCheckOutStart(shift.check_out_start || '12:00')
    setFormCheckOutOnTimeStart(shift.check_out_on_time_start || '12:30')
    setFormCheckOutOnTimeEnd(shift.check_out_on_time_end || '13:30')
    setFormCheckOutEnd(shift.check_out_end || '14:00')
    setFormApplicableDays(shift.applicable_days || [1, 2, 3, 4, 5, 6])
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formName.trim() || !formCode.trim()) {
      setFormError('Nama dan kode wajib diisi')
      return
    }

    setFormSubmitting(true)
    setFormError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setFormError('Sesi login tidak ditemukan')
        return
      }

      const payload: any = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim(),
        shift_category: formCategory,
        check_in_start: formCheckInStart,
        check_in_on_time_start: formCheckInOnTimeStart,
        check_in_on_time_end: formCheckInOnTimeEnd,
        check_in_end: formCheckInEnd,
        require_check_out: formRequireCheckOut,
        applicable_days: formApplicableDays,
      }

      if (formRequireCheckOut) {
        payload.check_out_start = formCheckOutStart
        payload.check_out_on_time_start = formCheckOutOnTimeStart
        payload.check_out_on_time_end = formCheckOutOnTimeEnd
        payload.check_out_end = formCheckOutEnd
      }

      if (editingShift) {
        await axios.put(
          `${API_URL}/api/school-admin/attendance/shifts/${editingShift.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Shift berhasil diperbarui!')
      } else {
        await axios.post(
          `${API_URL}/api/school-admin/attendance/shifts`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Shift berhasil dibuat!')
      }

      setIsModalOpen(false)
      await fetchShifts()
    } catch (error: any) {
      setFormError(error.response?.data?.error || error.message || 'Terjadi kesalahan')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus shift ini?')) return
    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(
        `${API_URL}/api/school-admin/attendance/shifts/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showSuccess('Shift berhasil dihapus!')
      await fetchShifts()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal menghapus shift')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  const toggleDay = (day: number) => {
    setFormApplicableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Shift Absensi</h1>
          <p className="text-xs text-tp-muted">
            Kelola shift masuk/pulang dengan cut-off jam yang bisa dikonfigurasi.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Buat Shift Baru
        </Button>
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

      {/* List */}
      <div className="rounded-2xl border border-tp-border bg-white shadow-sm">
        {loading ? (
          <p className="text-center text-xs text-tp-muted py-12">Memuat shift...</p>
        ) : shifts.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <Clock size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-tp-text mb-1">Belum Ada Shift</p>
            <p>Klik "Buat Shift Baru" untuk memulai.</p>
          </div>
        ) : (
          <div className="divide-y divide-tp-border">
            {shifts.map((shift) => (
              <div key={shift.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-tp-text">{shift.name}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded font-mono">
                        {shift.code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded capitalize">
                        {shift.shift_category}
                      </span>
                      {shift.is_default && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded inline-flex items-center gap-1">
                          <Star size={9} /> Default
                        </span>
                      )}
                      {!shift.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 rounded">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    {shift.description && (
                      <p className="text-[11px] text-tp-muted mb-2">{shift.description}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {/* Check-in */}
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-2">
                          Check-In Window
                        </p>
                        <div className="space-y-1 text-[11px] text-gray-700">
                          <div className="flex justify-between">
                            <span>Mulai</span>
                            <span className="font-mono">{shift.check_in_start}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>On-time</span>
                            <span className="font-mono">
                              {shift.check_in_on_time_start} - {shift.check_in_on_time_end}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cut-off</span>
                            <span className="font-mono font-bold text-red-600">
                              {shift.check_in_end}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Check-out */}
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold mb-2">
                          {shift.require_check_out ? 'Check-Out Window' : 'Check-Out: Nonaktif'}
                        </p>
                        {shift.require_check_out && shift.check_out_start ? (
                          <div className="space-y-1 text-[11px] text-gray-700">
                            <div className="flex justify-between">
                              <span>Mulai</span>
                              <span className="font-mono">{shift.check_out_start}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>On-time</span>
                              <span className="font-mono">
                                {shift.check_out_on_time_start} - {shift.check_out_on_time_end}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cut-off</span>
                              <span className="font-mono font-bold text-red-600">
                                {shift.check_out_end}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">
                            Tidak ada scan pulang
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Applicable Days */}
                    <div className="flex items-center gap-1 mt-3">
                      <span className="text-[10px] text-tp-muted mr-1">Hari:</span>
                      {DAY_OPTIONS.map((day) => (
                        <span
                          key={day.value}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            shift.applicable_days?.includes(day.value)
                              ? 'bg-tp-green text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(shift)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text">
                {editingShift ? 'Edit Shift' : 'Buat Shift Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">
                    Nama Shift *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Shift Pagi"
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">
                    Kode *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="PAGI"
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Opsional"
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  />
                </div>
              </div>

              {/* Check-In Window */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
                <h4 className="text-xs font-bold text-emerald-800 mb-3">
                  Window Check-In (Datang)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                      Buka
                    </label>
                    <input
                      type="time"
                      value={formCheckInStart}
                      onChange={(e) => setFormCheckInStart(e.target.value)}
                      className="w-full rounded-lg border border-tp-border px-2 py-1.5 text-xs outline-none focus:border-tp-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                      Tepat (mulai)
                    </label>
                    <input
                      type="time"
                      value={formCheckInOnTimeStart}
                      onChange={(e) => setFormCheckInOnTimeStart(e.target.value)}
                      className="w-full rounded-lg border border-tp-border px-2 py-1.5 text-xs outline-none focus:border-tp-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                      Tepat (akhir)
                    </label>
                    <input
                      type="time"
                      value={formCheckInOnTimeEnd}
                      onChange={(e) => setFormCheckInOnTimeEnd(e.target.value)}
                      className="w-full rounded-lg border border-tp-border px-2 py-1.5 text-xs outline-none focus:border-tp-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-red-600 mb-1">
                      Cut-off (terlambat)
                    </label>
                    <input
                      type="time"
                      value={formCheckInEnd}
                      onChange={(e) => setFormCheckInEnd(e.target.value)}
                      className="w-full rounded-lg border border-red-200 px-2 py-1.5 text-xs outline-none focus:border-red-400 bg-red-50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Check-Out Window */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-blue-800">
                    Window Check-Out (Pulang)
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formRequireCheckOut}
                      onChange={(e) => setFormRequireCheckOut(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-[11px] font-medium text-gray-700">
                      Wajib scan pulang
                    </span>
                  </label>
                </div>
                {formRequireCheckOut && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                        Buka
                      </label>
                      <input
                        type="time"
                        value={formCheckOutStart}
                        onChange={(e) => setFormCheckOutStart(e.target.value)}
                        className="w-full rounded-lg border border-tp-border px-2 py-1.5 text-xs outline-none focus:border-tp-green"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                        Tepat (mulai)
                      </label>
                      <input
                        type="time"
                        value={formCheckOutOnTimeStart}
                        onChange={(e) => setFormCheckOutOnTimeStart(e.target.value)}
                        className="w-full rounded-lg border border-tp-border px-2 py-1.5 text-xs outline-none focus:border-tp-green"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                        Tepat (akhir)
                      </label>
                      <input
                        type="time"
                        value={formCheckOutOnTimeEnd}
                        onChange={(e) => setFormCheckOutOnTimeEnd(e.target.value)}
                        className="w-full rounded-lg border border-tp-border px-2 py-1.5 text-xs outline-none focus:border-tp-green"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-red-600 mb-1">
                        Cut-off
                      </label>
                      <input
                        type="time"
                        value={formCheckOutEnd}
                        onChange={(e) => setFormCheckOutEnd(e.target.value)}
                        className="w-full rounded-lg border border-red-200 px-2 py-1.5 text-xs outline-none focus:border-red-400 bg-red-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Applicable Days */}
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-2">
                  Hari Berlaku
                </label>
                <div className="flex gap-1.5">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        formApplicableDays.includes(day.value)
                          ? 'bg-tp-green text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2 border-t border-tp-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {formSubmitting
                    ? 'Menyimpan...'
                    : editingShift
                    ? 'Update Shift'
                    : 'Simpan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}