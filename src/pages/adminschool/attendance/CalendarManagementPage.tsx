import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../components/ui/button'
import {
  Plus,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  Calendar as CalendarIcon,
  Pencil,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface CalendarEvent {
  id: string
  calendar_date: string
  day_type: string
  name: string
  description: string
  is_attendance_required: boolean
  include_in_report: boolean
}

const DAY_TYPE_OPTIONS = [
  { value: 'school_day', label: 'Hari Sekolah', color: 'bg-green-100 text-green-700' },
  { value: 'holiday', label: 'Libur', color: 'bg-red-100 text-red-700' },
  { value: 'weekend', label: 'Weekend', color: 'bg-gray-100 text-gray-700' },
  { value: 'exam', label: 'Ujian', color: 'bg-amber-100 text-amber-700' },
  { value: 'event', label: 'Event', color: 'bg-blue-100 text-blue-700' },
  { value: 'emergency', label: 'Darurat', color: 'bg-orange-100 text-orange-700' },
]

export default function CalendarManagementPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [filterMonth, setFilterMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  )

  const [formDate, setFormDate] = useState('')
  const [formType, setFormType] = useState('holiday')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAttendanceRequired, setFormAttendanceRequired] = useState(false)
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

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return

      const [year, month] = filterMonth.split('-')
      const fromDate = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const toDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

      const res = await axios.get(
        `${API_URL}/api/school-admin/calendar?from=${fromDate}&to=${toDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEvents(res.data?.calendar ?? [])
    } catch (error: any) {
      console.error('Gagal fetch calendar:', error)
      setErrorMessage(error.response?.data?.error || 'Gagal memuat kalender')
    } finally {
      setLoading(false)
    }
  }, [API_URL, filterMonth])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const resetForm = () => {
    setEditingEvent(null)
    setFormDate('')
    setFormType('holiday')
    setFormName('')
    setFormDescription('')
    setFormAttendanceRequired(false)
    setFormError('')
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormDate(event.calendar_date)
    setFormType(event.day_type)
    setFormName(event.name)
    setFormDescription(event.description || '')
    setFormAttendanceRequired(event.is_attendance_required)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formDate || !formName.trim()) {
      setFormError('Tanggal dan nama wajib diisi')
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

      const payload = {
        calendar_date: formDate,
        day_type: formType,
        name: formName.trim(),
        description: formDescription.trim(),
        is_attendance_required: formAttendanceRequired,
        include_in_report: true,
      }

      if (editingEvent) {
        await axios.put(
          `${API_URL}/api/school-admin/calendar/${editingEvent.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Event berhasil diperbarui!')
      } else {
        await axios.post(
          `${API_URL}/api/school-admin/calendar`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showSuccess('Event berhasil ditambahkan!')
      }

      setIsModalOpen(false)
      await fetchEvents()
    } catch (error: any) {
      setFormError(error.response?.data?.error || error.message || 'Terjadi kesalahan')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus event ini?')) return
    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(
        `${API_URL}/api/school-admin/calendar/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showSuccess('Event berhasil dihapus!')
      await fetchEvents()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal menghapus')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  const getDayTypeBadge = (type: string) => {
    const opt = DAY_TYPE_OPTIONS.find((o) => o.value === type)
    return opt ? (
      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${opt.color}`}>
        {opt.label}
      </span>
    ) : (
      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
        {type}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Kalender Akademik</h1>
          <p className="text-xs text-tp-muted">
            Atur hari libur, ujian, dan event sekolah.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Tambah Event
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

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-tp-muted">Bulan:</label>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-xl border border-tp-border px-3 py-2 text-xs outline-none focus:border-tp-green"
        />
      </div>

      {/* List */}
      <div className="rounded-2xl border border-tp-border bg-white shadow-sm">
        {loading ? (
          <p className="text-center text-xs text-tp-muted py-12">Memuat kalender...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <CalendarIcon size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-tp-text mb-1">Belum Ada Event</p>
            <p>Tambahkan libur nasional atau event sekolah.</p>
          </div>
        ) : (
          <div className="divide-y divide-tp-border">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getDayTypeBadge(event.day_type)}
                    <span className="text-xs font-semibold text-tp-text">
                      {event.name}
                    </span>
                    {event.is_attendance_required && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">
                        Absensi Wajib
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-tp-muted mt-1">
                    {formatDate(event.calendar_date)}
                  </p>
                  {event.description && (
                    <p className="text-[11px] text-tp-muted italic mt-0.5">
                      {event.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(event)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text">
                {editingEvent ? 'Edit Event' : 'Tambah Event Kalender'}
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
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Jenis Hari *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                >
                  {DAY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Nama Event *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Hari Kemerdekaan RI"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Opsional"
                  rows={2}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAttendanceRequired}
                  onChange={(e) => setFormAttendanceRequired(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs font-medium text-gray-700">
                  Wajib absensi di hari ini
                </span>
              </label>

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
                  {formSubmitting ? 'Menyimpan...' : editingEvent ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}