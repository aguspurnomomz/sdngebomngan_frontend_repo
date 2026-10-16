import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Key, Printer, Users, Loader2, AlertCircle,
  CheckCircle2, Clock,
} from 'lucide-react'
import { examParticipantApi } from '../api'
import { usePersonalExamParticipants } from '../../hooks/usePersonalExamParticipants'
import { usePersonalExamDetail } from '../../hooks/usePersonalExamDetail'
import { useAuthToken } from '@/features/hooks/useAuthToken'
import { AddParticipantsModal } from '../components/AddParticipantsModal'
import { ParticipantRow } from '../components/ParticipantRow'

export default function PersonalExamParticipantsPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const { token } = useAuthToken()

  const { exam } = usePersonalExamDetail(examId)
  const { participants, stats, loading, error, refetch } =
    usePersonalExamParticipants(examId)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addingParticipants, setAddingParticipants] = useState(false)

  const [generatingCodes, setGeneratingCodes] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<{ id: string; type: 'code' | 'link' } | null>(null)

  // ==========================================
  // Handlers
  // ==========================================
  const handleAddParticipants = async (studentIds: string[]) => {
    if (!token || !examId) return

    setAddingParticipants(true)
    setActionError(null)
    try {
      const result = await examParticipantApi.assign(token, examId, {
        personal_student_ids: studentIds,
      })
      setShowAddModal(false)
      setActionSuccess(
        `${result.assigned} siswa ditambahkan${result.skipped > 0 ? `, ${result.skipped} sudah ada` : ''}`,
      )
      refetch()
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message)
    } finally {
      setAddingParticipants(false)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    if (!token || !examId) return
    if (!confirm('Hapus peserta ini dari ujian?')) return

    setLoadingAction(`remove-${participantId}`)
    setActionError(null)
    try {
      await examParticipantApi.remove(token, examId, participantId)
      refetch()
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRegenerateCode = async (participantId: string) => {
    if (!token || !examId) return
    if (!confirm('Generate kode baru? Kode lama tidak akan berlaku lagi.')) return

    setLoadingAction(`regen-${participantId}`)
    setActionError(null)
    try {
      const result = await examParticipantApi.regenerateCode(token, examId, participantId)
      setActionSuccess(`Kode baru: ${result.access_code}`)
      refetch()
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGenerateAllCodes = async () => {
    if (!token || !examId) return
    if (stats.without_code === 0) {
      alert('Semua peserta sudah punya access code')
      return
    }
    if (
      !confirm(
        `Generate access code untuk ${stats.without_code} peserta yang belum punya?`,
      )
    )
      return

    setGeneratingCodes(true)
    setActionError(null)
    try {
      const result = await examParticipantApi.generateCodes(token, examId)
      setActionSuccess(`${result.generated} access code berhasil dibuat`)
      refetch()
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message)
    } finally {
      setGeneratingCodes(false)
    }
  }

  const handleCopy = async (text: string, id: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId({ id, type })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedId({ id, type })
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

 
  if (loading && participants.length === 0) {
    return (
      <div className="grid place-items-center py-20 text-tp-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate(`/personal-exams/${examId}`)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-tp-border bg-white hover:bg-slate-50 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-tp-muted" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-tp-text">Kelola Peserta</h1>
          {exam && (
            <p className="text-xs text-tp-muted mt-0.5 truncate">
              {exam.title}
            </p>
          )}
        </div>
      </div>


      {actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800">{actionSuccess}</p>
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">{actionError}</p>
        </div>
      )}

  
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total Peserta"
          value={`${stats.total}`}
        />
        <StatCard
          icon={<Key className="h-4 w-4" />}
          label="Punya Kode"
          value={`${stats.with_code}`}
          highlight={stats.without_code > 0 ? 'warn' : 'ok'}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Belum Punya Kode"
          value={`${stats.without_code}`}
          highlight={stats.without_code > 0 ? 'warn' : undefined}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Sudah Submit"
          value={`${stats.submitted}`}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-3.5 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Peserta
        </button>

        {stats.without_code > 0 && (
          <button
            type="button"
            onClick={handleGenerateAllCodes}
            disabled={generatingCodes}
            className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3.5 py-2 text-xs font-semibold text-tp-muted hover:bg-slate-50 disabled:opacity-50"
          >
            {generatingCodes ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Key className="h-3.5 w-3.5" />
            )}
            Generate {stats.without_code} Kode
          </button>
        )}

        {stats.with_code > 0 && (
          <button
            type="button"
            onClick={() => navigate(`/personal-exams/${examId}/qr-sheet`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-3.5 py-2 text-xs font-semibold text-tp-muted hover:bg-slate-50 ml-auto"
          >
            <Printer className="h-3.5 w-3.5" /> Cetak QR Sheet
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tp-border bg-white py-16 px-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
            <Users className="h-7 w-7 text-tp-green" />
          </div>
          <h3 className="text-base font-bold text-tp-text mb-1">
            Belum ada peserta
          </h3>
          <p className="text-xs text-tp-muted mb-5 max-w-sm mx-auto">
            Tambahkan siswa personal ke ujian ini. Setelah itu, generate access
            code per siswa dan bagikan via QR / link.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Peserta Pertama
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-tp-border bg-white overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-tp-border">
            <div className="col-span-4 text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
              Siswa
            </div>
            <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
              Access Code
            </div>
            <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-tp-muted">
              Status
            </div>
            <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-tp-muted text-right">
              Aksi
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-tp-border">
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                onCopyCode={(code) => handleCopy(code, p.id, 'code')}
                onCopyLink={(link) => handleCopy(link, p.id, 'link')}
                onRegenerate={handleRegenerateCode}
                onRemove={handleRemoveParticipant}
                isCopied={copiedId?.id === p.id ? copiedId.type : null}
                loadingAction={loadingAction}
              />
            ))}
          </div>
        </div>
      )}


      <AddParticipantsModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddParticipants}
        excludeIds={participants.map((p) => p.personal_student_id)}
        loading={addingParticipants}
      />
    </div>
  )
}


function StatCard({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: 'ok' | 'warn'
}) {
  const colorClass =
    highlight === 'warn'
      ? 'border-amber-200 bg-amber-50'
      : highlight === 'ok'
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-tp-border bg-white'

  return (
    <div className={`rounded-xl border p-3 ${colorClass}`}>
      <div className="flex items-center gap-1.5 text-tp-muted mb-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-tp-text">{value}</p>
    </div>
  )
}