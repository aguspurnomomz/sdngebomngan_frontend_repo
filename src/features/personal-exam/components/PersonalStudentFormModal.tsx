import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import type { PersonalStudent, CreatePersonalStudentPayload } from '../types'
import { personalStudentApi } from '../api'
import { useAuthToken } from '@/features/hooks/useAuthToken'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  student?: PersonalStudent | null // kalau ada = edit mode
}

export function PersonalStudentFormModal({ open, onClose, onSuccess, student }: Props) {
  const { token } = useAuthToken()
  const isEdit = !!student

  const [fullName, setFullName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [nisn, setNisn] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset / populate saat modal buka
  useEffect(() => {
    if (!open) return
    if (student) {
      setFullName(student.full_name)
      setStudentNumber(student.student_number || '')
      setNisn(student.nisn || '')
      setEmail(student.email || '')
      setNotes(student.notes || '')
    } else {
      setFullName('')
      setStudentNumber('')
      setNisn('')
      setEmail('')
      setNotes('')
    }
    setError(null)
  }, [open, student])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!fullName.trim()) {
      setError('Nama lengkap wajib diisi')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEdit && student) {
        await personalStudentApi.update(token, student.id, {
          full_name: fullName.trim(),
          student_number: studentNumber.trim(),
          nisn: nisn.trim(),
          email: email.trim(),
          notes: notes.trim(),
        })
      } else {
        const payload: CreatePersonalStudentPayload = {
          full_name: fullName.trim(),
          student_number: studentNumber.trim() || undefined,
          nisn: nisn.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        }
        await personalStudentApi.create(token, payload)
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tp-border px-5 py-4">
          <h3 className="text-base font-bold text-tp-text">
            {isEdit ? 'Edit Siswa' : 'Tambah Siswa'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-7 w-7 place-items-center rounded-lg text-tp-muted hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: nama murid"
              autoFocus
              disabled={saving}
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tp-text mb-1.5">
                NISN
              </label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="0081234567"
                disabled={saving}
                className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tp-text mb-1.5">
                No. Absen
              </label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="01"
                disabled={saving}
                className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Email (opsional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="murid@cthmail.com"
              disabled={saving}
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tp-text mb-1.5">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Les privat matematika setiap Sabtu"
              rows={2}
              disabled={saving}
              className="w-full rounded-lg border border-tp-border bg-white px-3 py-2 text-sm focus:border-tp-green focus:outline-none disabled:bg-slate-50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : isEdit ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Siswa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}