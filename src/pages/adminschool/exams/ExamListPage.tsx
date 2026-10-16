import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, FileText, MoreVertical, Edit3, Trash2,
  Rocket, Archive, Eye, Clock, Users, Award, 
  CheckCircle2, Circle, AlertCircle,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

type ExamItem = {
  id: string
  title: string
  description: string
  subject: string
  exam_type: string
  grade_level: string
  phase: string
  duration_minutes: number
  total_questions: number
  total_score: number
  passing_score: number
  status: 'draft' | 'published' | 'archived'
  is_active: boolean
  created_at: string
  updated_at: string
  published_at: string | null
  academic_year_name: string
  semester: string
  targets: Array<{
    id: string
    class_group_id: string | null
    class_sub_group_id: string | null
    class_group_name: string
    class_sub_group_name: string
  }>
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  regular: 'Ulangan Harian',
  quiz: 'Quiz',
  uts: 'UTS',
  uas: 'UAS',
  tryout: 'Try Out',
  remedial: 'Remedial',
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    icon: Circle,
    dot: 'bg-slate-400',
  },
  published: {
    label: 'Published',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
  },
  archived: {
    label: 'Archived',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: Archive,
    dot: 'bg-amber-500',
  },
}

export default function ExamListPage() {
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL

  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [schoolInactive, setSchoolInactive] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ExamItem | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<ExamItem | null>(null)

  const extractErrorMessage = (err: any): string => {
    return err?.response?.data?.error || err?.message || 'Terjadi kesalahan.'
  }

  const isSchoolInactiveError = (err: any): boolean => {
    const status = err?.response?.status
    const message = extractErrorMessage(err).toLowerCase()
    return status === 403 && message.includes('dinonaktifkan')
  }

  const fetchExams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await axios.get(`${API_URL}/api/school-admin/exams`, {
        params,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      setExams(res.data.exams || [])
      setSchoolInactive(false) 
    } catch (e: any) {
   
      if (isSchoolInactiveError(e)) {
        setSchoolInactive(true)
      } else {
        setError(extractErrorMessage(e))
      }
    } finally {
      setLoading(false)
    }
  }, [API_URL, statusFilter, search])

  useEffect(() => {
    const t = setTimeout(fetchExams, 300)
    return () => clearTimeout(t)
  }, [fetchExams])

  // Close dropdown kalau klik di luar
  useEffect(() => {
    const handler = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [openMenuId])

  const handlePublish = async (exam: ExamItem) => {
    if (!confirm(`Publikasikan ujian "${exam.title}"? Setelah dipublish, ujian tidak bisa diedit.`)) return
    setActionLoading(exam.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.patch(
        `${API_URL}/api/school-admin/exams/${exam.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      await fetchExams()
    } catch (e: any) {
      if (isSchoolInactiveError(e)) {
        setSchoolInactive(true)
      } else {
        alert(extractErrorMessage(e))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleArchive = async () => {
    if (!confirmArchive) return
    setActionLoading(confirmArchive.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.patch(
        `${API_URL}/api/school-admin/exams/${confirmArchive.id}/archive`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setConfirmArchive(null)
      await fetchExams()
    } catch (e: any) {
      if (isSchoolInactiveError(e)) {
        setSchoolInactive(true)
        setConfirmArchive(null)
      } else {
        alert(extractErrorMessage(e))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setActionLoading(confirmDelete.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.delete(
        `${API_URL}/api/school-admin/exams/${confirmDelete.id}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      setConfirmDelete(null)
      await fetchExams()
    } catch (e: any) {
      if (isSchoolInactiveError(e)) {
        setSchoolInactive(true)
        setConfirmDelete(null)
      } else {
        alert(extractErrorMessage(e))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const stats = {
    all: exams.length,
    draft: exams.filter((e) => e.status === 'draft').length,
    published: exams.filter((e) => e.status === 'published').length,
    archived: exams.filter((e) => e.status === 'archived').length,
  }

  if (schoolInactive) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-tp-text">Kelola Soal Ujian</h1>
          <p className="text-xs text-tp-muted">
            Buat dan kelola soal ujian untuk siswa di sekolah Anda
          </p>
        </div>

        {/* Card sekolah nonaktif */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-100">
            <AlertCircle size={28} className="text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-rose-900 mb-2">
            Sekolah Anda Sedang Dinonaktifkan
          </h3>
          <p className="text-xs text-rose-700 mb-1 max-w-md mx-auto">
            Akses ke fitur Kelola Soal Ujian untuk sementara waktu ditutup.
          </p>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Silakan hubungi administrator untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-tp-text">Kelola Soal Ujian</h1>
          <p className="text-xs text-tp-muted">
            Buat dan kelola soal ujian untuk siswa di sekolah Anda
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/school-admin/dashboard/exams/create')}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Buat Soal Ujian
        </button>
      </div>

      {/* Filter tabs */}
      <div className="rounded-2xl border border-tp-border bg-white p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'draft', 'published', 'archived'] as const).map((s) => {
            const active = statusFilter === s
            const label = s === 'all' ? 'Semua' : STATUS_CONFIG[s].label
            const count = stats[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-tp-green text-white'
                    : 'text-tp-muted hover:bg-slate-100'
                }`}
              >
                {label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 text-tp-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tp-muted"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul ujian atau deskripsi..."
          className="w-full rounded-xl border border-tp-border bg-white pl-10 pr-4 py-2.5 text-sm focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20"
        />
      </div>

      {/* Error — hanya tampil jika BUKAN karena sekolah nonaktif */}
      {error && !schoolInactive && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-tp-border bg-white"
            />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tp-border bg-white p-12 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-bold text-tp-text">
            {search
              ? 'Tidak ada ujian yang cocok'
              : statusFilter === 'all'
              ? 'Belum ada ujian'
              : `Belum ada ujian berstatus ${STATUS_CONFIG[statusFilter as 'draft' | 'published' | 'archived'].label}`}
          </p>
          <p className="mb-5 text-xs text-tp-muted">
            {search
              ? 'Coba kata kunci lain atau reset filter.'
              : 'Mulai buat ujian pertama Anda dengan klik tombol di bawah.'}
          </p>
          {!search && statusFilter === 'all' && (
            <button
              type="button"
              onClick={() => navigate('/school-admin/dashboard/exams/create')}
              className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover"
            >
              <Plus size={16} /> Buat Ujian Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              actionLoading={actionLoading}
              onEdit={() => navigate(`/school-admin/dashboard/exams/${exam.id}/edit`)}
              onViewDetail={() => navigate(`/school-admin/dashboard/exams/${exam.id}`)}
              onPublish={() => handlePublish(exam)}
              onArchive={() => setConfirmArchive(exam)}
              onDelete={() => setConfirmDelete(exam)}
            />
          ))}
        </div>
      )}

      {/* Modal Delete */}
      {confirmDelete && (
        <ConfirmModal
          title="Hapus Ujian"
          message={`Yakin hapus ujian "${confirmDelete.title}"? Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel={actionLoading === confirmDelete.id ? 'Menghapus...' : 'Ya, Hapus'}
          confirmStyle="rose"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          loading={actionLoading === confirmDelete.id}
        />
      )}

      {/* Modal Archive */}
      {confirmArchive && (
        <ConfirmModal
          title="Arsipkan Ujian"
          message={`Arsipkan ujian "${confirmArchive.title}"? Ujian tidak akan tampil untuk siswa, tapi data tetap tersimpan.`}
          confirmLabel={actionLoading === confirmArchive.id ? 'Memproses...' : 'Ya, Arsipkan'}
          confirmStyle="amber"
          onCancel={() => setConfirmArchive(null)}
          onConfirm={handleArchive}
          loading={actionLoading === confirmArchive.id}
        />
      )}
    </div>
  )
}


type ExamCardProps = {
  exam: ExamItem
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  actionLoading: string | null
  onEdit: () => void
  onViewDetail: () => void
  onPublish: () => void
  onArchive: () => void
  onDelete: () => void
}

function ExamCard({
  exam,
  openMenuId,
  setOpenMenuId,
  actionLoading,
  onEdit,
  onViewDetail,
  onPublish,
  onArchive,
  onDelete,
}: ExamCardProps) {
  const StatusIcon = STATUS_CONFIG[exam.status].icon
  const statusCfg = STATUS_CONFIG[exam.status]

  const uniqueClasses = new Set(exam.targets?.map((t) => t.class_group_id)).size
  const totalTargets = exam.targets?.length || 0

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="group relative rounded-2xl border border-tp-border bg-white p-5 transition hover:border-tp-green/40 hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-tp-text truncate">
              {exam.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text}`}
            >
              <StatusIcon size={11} />
              {statusCfg.label}
            </span>
          </div>

          {/* Description */}
          {exam.description && (
            <p className="mb-3 text-xs text-tp-muted line-clamp-2">
              {exam.description}
            </p>
          )}

          {/* Meta chips */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <Chip label={exam.subject} tone="green" />
            <Chip label={EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type} tone="slate" />
            {exam.grade_level && <Chip label={`Kelas ${exam.grade_level}`} tone="slate" />}
            {exam.phase && <Chip label={exam.phase} tone="slate" />}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-tp-muted">
            <span className="inline-flex items-center gap-1">
              <FileText size={12} />
              <b className="text-tp-text">{exam.total_questions}</b> soal
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              <b className="text-tp-text">{exam.duration_minutes}</b> menit
            </span>
            <span className="inline-flex items-center gap-1">
              <Award size={12} />
              KKM <b className="text-tp-text">{exam.passing_score}</b>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={12} />
              <b className="text-tp-text">{totalTargets}</b> sub kelas
              {uniqueClasses > 0 && (
                <span className="text-tp-faint">({uniqueClasses} kelas)</span>
              )}
            </span>
          </div>

          {/* Footer info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-tp-faint">
            <span>Dibuat: {formatDate(exam.created_at)}</span>
            {exam.published_at && (
              <>
                <span>•</span>
                <span>Dipublish: {formatDate(exam.published_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {exam.status === 'draft' && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3 py-2 text-xs font-semibold text-tp-text transition hover:bg-slate-50"
            >
              <Edit3 size={13} /> Edit
            </button>
          )}

          {exam.status === 'draft' && (
            <button
              type="button"
              disabled={actionLoading === exam.id}
              onClick={onPublish}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-tp-green-hover disabled:opacity-50"
            >
              <Rocket size={13} />
              {actionLoading === exam.id ? 'Loading...' : 'Publish'}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(openMenuId === exam.id ? null : exam.id)
              }}
              className="grid h-9 w-9 place-items-center rounded-xl border border-tp-border bg-white text-tp-muted transition hover:bg-slate-50"
            >
              <MoreVertical size={14} />
            </button>

            {openMenuId === exam.id && (
              <div
                className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-tp-border bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <MenuItem
                  icon={<Eye size={14} />}
                  label="Lihat Detail"
                  onClick={() => {
                    setOpenMenuId(null)
                    onViewDetail()
                  }}
                />
                {exam.status === 'draft' && (
                  <MenuItem
                    icon={<Edit3 size={14} />}
                    label="Edit Ujian"
                    onClick={() => {
                      setOpenMenuId(null)
                      onEdit()
                    }}
                  />
                )}
                {exam.status === 'published' && (
                  <MenuItem
                    icon={<Archive size={14} />}
                    label="Arsipkan"
                    onClick={() => {
                      setOpenMenuId(null)
                      onArchive()
                    }}
                  />
                )}
                {exam.status === 'draft' && (
                  <MenuItem
                    icon={<Archive size={14} />}
                    label="Arsipkan"
                    onClick={() => {
                      setOpenMenuId(null)
                      onArchive()
                    }}
                  />
                )}
                <div className="border-t border-tp-border" />
                <MenuItem
                  icon={<Trash2 size={14} />}
                  label="Hapus"
                  tone="rose"
                  onClick={() => {
                    setOpenMenuId(null)
                    onDelete()
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({
  label,
  tone = 'slate',
}: {
  label: string
  tone?: 'green' | 'slate' | 'amber'
}) {
  const tones = {
    green: 'bg-tp-green/10 text-tp-green',
    slate: 'bg-slate-100 text-tp-muted',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
      {label}
    </span>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'rose'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium transition ${
        tone === 'rose'
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-tp-text hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmStyle = 'rose',
  onCancel,
  onConfirm,
  loading,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmStyle?: 'rose' | 'amber'
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const styles = {
    rose: 'bg-rose-600 hover:bg-rose-700',
    amber: 'bg-amber-500 hover:bg-amber-600',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-lg font-bold text-tp-text">{title}</h3>
        <p className="mb-6 text-sm text-tp-muted">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${styles[confirmStyle]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}