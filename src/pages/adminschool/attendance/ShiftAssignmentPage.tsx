import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../components/ui/button'
import {
  Plus,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  Layers,
  Star,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface Assignment {
  id: string
  class_group_id: string | null
  class_sub_group_id: string | null
  shift_id: string
  priority: number
  is_primary: boolean
  is_active: boolean
  class_group_name: string
  class_sub_group_name: string
  shift_name: string
  shift_code: string
}

interface Shift {
  id: string
  name: string
  code: string
}

interface ClassGroup {
  id: string
  name: string
}

interface SubClass {
  id: string
  name: string
  class_group_id: string
}

export default function ShiftAssignmentPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [subClasses, setSubClasses] = useState<SubClass[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formShiftID, setFormShiftID] = useState('')
  const [formClassGroupID, setFormClassGroupID] = useState('')
  const [formSubClassID, setFormSubClassID] = useState('')
  const [formPriority, setFormPriority] = useState(1)
  const [formIsPrimary, setFormIsPrimary] = useState(true)
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

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return
      const headers = { Authorization: `Bearer ${token}` }

      const [assignRes, shiftsRes, classesRes, subClassesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/school-admin/attendance/assignments`, { headers }),
        axios.get(`${API_URL}/api/school-admin/attendance/shifts`, { headers }),
        axios.get(`${API_URL}/api/school-admin/classes`, { headers }),
        axios.get(`${API_URL}/api/school-admin/sub-classes`, { headers }),
      ])

      if (assignRes.status === 'fulfilled') setAssignments(assignRes.value.data?.assignments ?? [])
      if (shiftsRes.status === 'fulfilled') setShifts(shiftsRes.value.data?.shifts ?? [])
      if (classesRes.status === 'fulfilled') setClassGroups(classesRes.value.data?.classes ?? [])
      if (subClassesRes.status === 'fulfilled') setSubClasses(subClassesRes.value.data?.sub_classes ?? [])
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const resetForm = () => {
    setFormShiftID('')
    setFormClassGroupID('')
    setFormSubClassID('')
    setFormPriority(1)
    setFormIsPrimary(true)
    setFormError('')
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formShiftID) {
      setFormError('Shift wajib dipilih')
      return
    }
    if (!formClassGroupID && !formSubClassID) {
      setFormError('Pilih minimal satu kelas atau sub kelas')
      return
    }

    setFormSubmitting(true)
    setFormError('')

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.post(
        `${API_URL}/api/school-admin/attendance/assignments`,
        {
          shift_id: formShiftID,
          class_group_id: formClassGroupID,
          class_sub_group_id: formSubClassID,
          priority: formPriority,
          is_primary: formIsPrimary,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('Assignment berhasil dibuat!')
      setIsModalOpen(false)
      await fetchAll()
    } catch (error: any) {
      setFormError(error.response?.data?.error || error.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus assignment ini?')) return
    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(
        `${API_URL}/api/school-admin/attendance/assignments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showSuccess('Assignment berhasil dihapus!')
      await fetchAll()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Gagal menghapus')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  const filteredSubClasses = formClassGroupID
    ? subClasses.filter((sc) => sc.class_group_id === formClassGroupID)
    : subClasses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Assign Shift ke Kelas</h1>
          <p className="text-xs text-tp-muted">
            Mapping kelas mana pakai shift apa. 1 kelas bisa punya lebih dari 1 shift.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Tambah Assignment
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
          <p className="text-center text-xs text-tp-muted py-12">Memuat...</p>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <Layers size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-tp-text mb-1">Belum Ada Assignment</p>
            <p>Mapping kelas ke shift untuk memulai absensi otomatis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-tp-border bg-gray-50 text-xs text-tp-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Sub Kelas</th>
                  <th className="py-3 px-4">Prioritas</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-tp-text">
                          {a.shift_name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 rounded">
                          {a.shift_code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">{a.class_group_name || '-'}</td>
                    <td className="py-3 px-4 text-xs">
                      {a.class_sub_group_name ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                          {a.class_sub_group_name}
                        </span>
                      ) : (
                        <span className="text-tp-muted italic">Semua sub kelas</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono">{a.priority}</span>
                        {a.is_primary && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded inline-flex items-center gap-1">
                            <Star size={9} /> Primary
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text">Tambah Assignment</h3>
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
                  Shift *
                </label>
                <select
                  value={formShiftID}
                  onChange={(e) => setFormShiftID(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                  required
                >
                  <option value="">-- Pilih Shift --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Kelas (Master)
                </label>
                <select
                  value={formClassGroupID}
                  onChange={(e) => {
                    setFormClassGroupID(e.target.value)
                    setFormSubClassID('')
                  }}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classGroups.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Sub Kelas (opsional)
                </label>
                <select
                  value={formSubClassID}
                  onChange={(e) => setFormSubClassID(e.target.value)}
                  disabled={!formClassGroupID}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Semua Sub Kelas --</option>
                  {filteredSubClasses.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-tp-muted mt-1">
                  Kosongkan jika shift berlaku untuk seluruh kelas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">
                    Prioritas
                  </label>
                  <input
                    type="number"
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                    <input
                      type="checkbox"
                      checked={formIsPrimary}
                      onChange={(e) => setFormIsPrimary(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      Shift Utama
                    </span>
                  </label>
                </div>
              </div>

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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}