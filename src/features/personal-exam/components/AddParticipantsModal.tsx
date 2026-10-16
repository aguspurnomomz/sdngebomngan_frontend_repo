import { useEffect, useState } from 'react'
import { X, Search, Loader2, AlertCircle, Check } from 'lucide-react'
import { personalStudentApi } from '../api'
import type { PersonalStudent } from '../types'
import { useAuthToken } from '@/features/hooks/useAuthToken'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (studentIds: string[]) => Promise<void>
  excludeIds?: string[] 
  loading?: boolean
}

export function AddParticipantsModal({
  open, onClose, onSubmit, excludeIds = [], loading = false,
}: Props) {
  const { token } = useAuthToken()
  const [students, setStudents] = useState<PersonalStudent[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open || !token) return

    let cancelled = false
    const load = async () => {
      setLoadingList(true)
      setError(null)
      try {
        const data = await personalStudentApi.list(token, { active_only: true })
        if (!cancelled) setStudents(data.students || [])
      } catch (e: any) {
        if (!cancelled) setError(e.response?.data?.error || e.message)
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, token])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelected(new Set())
      setError(null)
    }
  }, [open])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) return
    await onSubmit(Array.from(selected))
  }


  const excludeSet = new Set(excludeIds)
  const filtered = students
    .filter((s) => !excludeSet.has(s.id))
    .filter((s) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        s.student_number.toLowerCase().includes(q)
      )
    })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tp-border px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-tp-text">Tambah Peserta</h3>
            <p className="text-xs text-tp-muted mt-0.5">
              Pilih siswa yang akan ikut ujian ini
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="grid h-7 w-7 place-items-center rounded-lg text-tp-muted hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tp-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NISN..."
              className="w-full rounded-lg border border-tp-border bg-white py-2 pl-9 pr-3 text-sm focus:border-tp-green focus:outline-none"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loadingList ? (
            <div className="grid place-items-center py-10 text-tp-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-tp-muted">
              {students.length === 0 ? (
                <>
                  Belum ada siswa personal.{' '}
                  <a
                    href="/personal-students"
                    className="text-tp-green font-semibold underline"
                  >
                    Tambah siswa dulu
                  </a>
                </>
              ) : search ? (
                'Tidak ada siswa yang cocok dengan pencarian'
              ) : (
                'Semua siswa sudah ditambahkan ke ujian ini'
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((s) => {
                const isSelected = selected.has(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSelect(s.id)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                      isSelected
                        ? 'border-tp-green bg-emerald-50'
                        : 'border-tp-border bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded border-2 ${
                        isSelected
                          ? 'border-tp-green bg-tp-green'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-tp-text truncate">
                        {s.full_name}
                      </p>
                      <p className="text-[11px] text-tp-muted">
                        {s.nisn && `NISN: ${s.nisn}`}
                        {s.nisn && s.student_number && ' • '}
                        {s.student_number && `No: ${s.student_number}`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-tp-border px-5 py-3 flex items-center justify-between gap-3">
          <span className="text-xs text-tp-muted">
            {selected.size > 0 ? (
              <>
                <strong className="text-tp-text">{selected.size}</strong> siswa
                dipilih
              </>
            ) : (
              'Belum ada yang dipilih'
            )}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-tp-border bg-white px-4 py-2 text-xs font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Tambahkan {selected.size > 0 && `(${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}