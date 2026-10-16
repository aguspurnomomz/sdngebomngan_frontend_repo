import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Search, FileText, Clock, Users, AlertCircle, Loader2 } from 'lucide-react'
import { usePersonalExams } from '../../hooks/usePersonalExams'
import { ExamStatusBadge } from '../components/ExamStatusBadge'

export default function PersonalExamListPage() {
  const navigate = useNavigate()
  const { exams, loading, error, filters, setFilters, refetch } = usePersonalExams()

  const [searchInput, setSearchInput] = useState(filters.search || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, search: searchInput.trim() })
  }

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-tp-text flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-tp-green" />
            Ujian Personal
          </h1>
          <p className="text-sm text-tp-muted mt-1">
            Buat ujian untuk siswa personal Anda — draft gratis, publish pakai token
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/personal-exams/create')}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover transition"
        >
          <Plus className="h-4 w-4" />
          Buat Ujian Baru
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'draft', label: 'Draft' },
          { key: 'published', label: 'Published' },
          { key: 'archived', label: 'Archived' },
        ].map((tab) => {
          const isActive =
            (tab.key === 'all' && !filters.status) || filters.status === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-tp-green text-white'
                  : 'bg-white border border-tp-border text-tp-muted hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}

        <form onSubmit={handleSearch} className="ml-auto relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tp-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari ujian..."
            className="w-full rounded-lg border border-tp-border bg-white py-2 pl-9 pr-3 text-xs text-tp-text focus:border-tp-green focus:outline-none"
          />
        </form>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-tp-border bg-white py-20">
          <div className="flex flex-col items-center gap-2 text-tp-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">Memuat ujian...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Gagal memuat data</p>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 text-xs font-semibold text-rose-700 underline hover:no-underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tp-border bg-white py-16 px-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
            <BookOpen className="h-7 w-7 text-tp-green" />
          </div>
          <h3 className="text-base font-bold text-tp-text mb-1">
            Belum ada ujian personal
          </h3>
          <p className="text-xs text-tp-muted mb-5 max-w-sm mx-auto">
            Mulai buat ujian pertama untuk siswa personal Anda. Draft gratis —
            hanya dikenakan token saat dipublikasikan.
          </p>
          <button
            type="button"
            onClick={() => navigate('/personal-exams/create')}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Ujian Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <button
              key={exam.id}
              type="button"
              onClick={() => navigate(`/personal-exams/${exam.id}`)}
              className="group text-left rounded-2xl border border-tp-border bg-white p-4 transition hover:border-tp-green hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <ExamStatusBadge status={exam.status} />
                {exam.exam_type && exam.exam_type !== 'regular' && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                    {exam.exam_type}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-tp-text line-clamp-2 mb-1 group-hover:text-tp-green transition">
                {exam.title}
              </h3>
              <p className="text-[11px] text-tp-muted line-clamp-1 mb-3">
                {exam.subject}
                {exam.grade_level && ` • ${exam.grade_level}`}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-tp-faint border-t border-tp-border pt-2.5">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {exam.total_questions} soal
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {exam.duration_minutes}m
                </span>
                {typeof exam.participant_count === 'number' && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {exam.participant_count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}