import { useState } from 'react'
import { Users, Plus, Search, Loader2, AlertCircle, Edit3, Trash2, UserCircle2} from 'lucide-react'
import { usePersonalStudents } from '../../hooks/usePersonalStudents'
import { useAuthToken } from '@/features/hooks/useAuthToken'
import { personalStudentApi } from '../api'
import type { PersonalStudent } from '../types'
import { PersonalStudentFormModal } from '../components/PersonalStudentFormModal'

export default function PersonalStudentManagementPage() {
  const { token } = useAuthToken()
  const { students, loading, error, search, setSearch, refetch } =
    usePersonalStudents()

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<PersonalStudent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAdd = () => {
    setEditingStudent(null)
    setShowFormModal(true)
  }

  const handleEdit = (student: PersonalStudent) => {
    setEditingStudent(student)
    setShowFormModal(true)
  }

  const handleDelete = async (student: PersonalStudent) => {
    if (!token) return
    if (
      !confirm(
        `Hapus siswa "${student.full_name}"? Siswa tidak akan muncul di daftar, tapi data ujian yang sudah ada tetap tersimpan.`,
      )
    )
      return

    setDeletingId(student.id)
    setActionError(null)
    try {
      await personalStudentApi.delete(token, student.id)
      refetch()
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-tp-text flex items-center gap-2">
            <Users className="h-6 w-6 text-tp-green" />
            Siswa Personal
          </h1>
          <p className="text-sm text-tp-muted mt-1">
            Kelola siswa yang akan mengikuti ujian personal Anda
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover transition"
        >
          <Plus className="h-4 w-4" />
          Tambah Siswa
        </button>
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">{actionError}</p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tp-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau NISN..."
          className="w-full rounded-lg border border-tp-border bg-white py-2 pl-9 pr-3 text-sm focus:border-tp-green focus:outline-none"
        />
      </div>


      {loading && students.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-tp-border bg-white py-20">
          <Loader2 className="h-5 w-5 animate-spin text-tp-muted" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm text-rose-700">Gagal memuat data: {error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tp-border bg-white py-16 px-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
            <Users className="h-7 w-7 text-tp-green" />
          </div>
          <h3 className="text-base font-bold text-tp-text mb-1">
            {search ? 'Tidak ada siswa yang cocok' : 'Belum ada siswa personal'}
          </h3>
          <p className="text-xs text-tp-muted mb-5 max-w-sm mx-auto">
            {search
              ? 'Coba ubah kata kunci pencarian Anda.'
              : 'Tambahkan siswa personal dulu sebelum bisa assign mereka ke ujian.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Siswa Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-tp-border bg-white overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-tp-border">
            <div className="col-span-5 text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
              Nama
            </div>
            <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
              NISN / Absen
            </div>
            <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
              Email
            </div>
            <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-tp-muted text-right">
              Aksi
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-tp-border">
            {students.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-slate-50 transition"
              >
                {/* Name */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-tp-green">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-tp-text truncate">
                      {student.full_name}
                    </p>
                    {student.notes && (
                      <p className="text-[11px] text-tp-muted truncate">
                        {student.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* NISN / Absen */}
                <div className="col-span-3 text-[11px] text-tp-muted">
                  {student.nisn && (
                    <p>
                      NISN: <span className="font-mono">{student.nisn}</span>
                    </p>
                  )}
                  {student.student_number && (
                    <p>
                      No: <span className="font-mono">{student.student_number}</span>
                    </p>
                  )}
                  {!student.nisn && !student.student_number && (
                    <span className="italic text-tp-faint">-</span>
                  )}
                </div>

                {/* Email */}
                <div className="col-span-2 text-[11px] text-tp-muted truncate">
                  {student.email || (
                    <span className="italic text-tp-faint">-</span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(student)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-tp-muted hover:bg-slate-200"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(student)}
                    disabled={deletingId === student.id}
                    className="grid h-7 w-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                    title="Hapus"
                  >
                    {deletingId === student.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PersonalStudentFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={refetch}
        student={editingStudent}
      />
    </div>
  )
}