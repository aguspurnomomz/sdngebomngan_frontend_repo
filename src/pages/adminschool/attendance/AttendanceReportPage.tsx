import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar as CalendarIcon,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface SessionOption {
  id: string
  title: string
  session_date: string
  status: string
}

interface ReportItem {
  student_id: string
  student_name: string
  nisn: string
  sub_class_name: string
  check_in_status: string | null
  check_in_time: string | null
  check_out_status: string | null
  check_out_time: string | null
  is_absent: boolean
}

interface SessionSummary {
  id: string
  title: string
  session_date: string
  shift_name: string
  class_group_name: string
  total_students: number
  total_check_in: number
  total_absent: number
  total_on_time: number
  total_late: number
}

export default function AttendanceReportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionIdFromUrl = searchParams.get('session') || ''

  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState(sessionIdFromUrl)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [report, setReport] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await axios.get(
        `${API_URL}/api/school-admin/attendance/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const all: SessionOption[] = (res.data?.sessions ?? [])
        .filter((s: any) => s.status === 'closed' || s.status === 'auto_closed' || s.status === 'open')
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          session_date: s.session_date,
          status: s.status,
        }))

      setSessions(all)


      if (!selectedSessionId && all.length > 0) {
        setSelectedSessionId(all[0].id)
      }
    } catch (e: any) {
      setError('Gagal memuat sesi')
    } finally {
      setLoading(false)
    }
  }, [API_URL, selectedSessionId])

  const fetchReport = useCallback(async () => {
    if (!selectedSessionId) return
    setReportLoading(true)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) return

      const [reportRes, summaryRes] = await Promise.allSettled([
        axios.get(
          `${API_URL}/api/school-admin/attendance/sessions/${selectedSessionId}/records`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_URL}/api/school-admin/attendance/sessions/${selectedSessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ])

      if (reportRes.status === 'fulfilled') {
        setReport(reportRes.value.data?.records ?? [])
      } else {
        setReport([])
      }

      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value.data?.session
        if (s) {
          setSummary({
            id: s.id,
            title: s.title,
            session_date: s.session_date,
            shift_name: s.shift_name,
            class_group_name: s.class_group_name,
            total_students: s.total_students || 0,
            total_check_in: s.total_check_in || 0,
            total_absent: s.total_absent || 0,
            total_on_time: s.total_on_time || 0,
            total_late: s.total_late || 0,
          })
        }
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal memuat rekap')
    } finally {
      setReportLoading(false)
    }
  }, [API_URL, selectedSessionId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    if (selectedSessionId) {
      setSearchParams({ session: selectedSessionId })
      fetchReport()
    }
  }, [selectedSessionId, fetchReport, setSearchParams])

  const exportCSV = () => {
    if (report.length === 0) return

    const headers = [
      'No',
      'Nama Siswa',
      'NISN',
      'Sub Kelas',
      'Status Datang',
      'Jam Datang',
      'Status Pulang',
      'Jam Pulang',
    ]

    const rows = report.map((r, i) => [
      i + 1,
      `"${r.student_name}"`,
      r.nisn || '-',
      r.sub_class_name || '-',
      getStatusLabel(r.check_in_status) || '-',
      r.check_in_time || '-',
      getStatusLabel(r.check_out_status) || '-',
      r.check_out_time || '-',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-absensi-${summary?.session_date || 'x'}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusLabel = (status: string | null): string => {
    if (!status) return ''
    const map: Record<string, string> = {
      on_time: 'Tepat Waktu',
      early: 'Datang Cepat',
      late: 'Terlambat',
      very_late: 'Sangat Terlambat',
      on_time_leave: 'Pulang Tepat',
      early_leave: 'Pulang Cepat',
      late_leave: 'Pulang Terlambat',
      absent: 'Absen',
      excused: 'Izin',
      sick: 'Sakit',
    }
    return map[status] || status
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-xs text-tp-muted">-</span>

    const colors: Record<string, string> = {
      on_time: 'bg-emerald-100 text-emerald-700',
      early: 'bg-blue-100 text-blue-700',
      late: 'bg-amber-100 text-amber-700',
      very_late: 'bg-red-100 text-red-700',
      on_time_leave: 'bg-emerald-100 text-emerald-700',
      early_leave: 'bg-amber-100 text-amber-700',
      late_leave: 'bg-orange-100 text-orange-700',
      absent: 'bg-red-100 text-red-700',
      excused: 'bg-purple-100 text-purple-700',
      sick: 'bg-pink-100 text-pink-700',
    }

    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {getStatusLabel(status)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-tp-green" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Rekap Absensi</h1>
          <p className="text-xs text-tp-muted">
            Lihat rekap kehadiran per sesi dan export ke CSV.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={report.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
        >
          <FileSpreadsheet size={16} />
          Export CSV
        </button>
      </div>

      {/* Session Selector */}
      <div className="bg-white rounded-2xl border border-tp-border p-4">
        <label className="block text-xs font-semibold text-tp-muted mb-2">
          Pilih Sesi
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
        >
          <option value="">-- Pilih Sesi --</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} • {new Date(s.session_date + 'T00:00:00').toLocaleDateString('id-ID')}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <XCircle size={20} className="text-red-600" />
          <span className="text-xs font-semibold text-red-900">{error}</span>
        </div>
      )}

      {!selectedSessionId ? (
        <div className="text-center py-12 text-tp-muted text-xs bg-white rounded-2xl border border-tp-border">
          <CalendarIcon size={32} className="mx-auto mb-3 opacity-40" />
          <p>Pilih sesi untuk melihat rekap.</p>
        </div>
      ) : reportLoading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-tp-border">
          <Loader2 size={24} className="animate-spin text-tp-green mx-auto" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-tp-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-tp-green" />
                  <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
                    Hadir
                  </p>
                </div>
                <p className="text-2xl font-bold text-tp-text">{summary.total_check_in}</p>
              </div>
              <div className="rounded-2xl border border-tp-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
                    Tepat Waktu
                  </p>
                </div>
                <p className="text-2xl font-bold text-tp-text">{summary.total_on_time}</p>
              </div>
              <div className="rounded-2xl border border-tp-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-amber-600" />
                  <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
                    Terlambat
                  </p>
                </div>
                <p className="text-2xl font-bold text-tp-text">{summary.total_late}</p>
              </div>
              <div className="rounded-2xl border border-tp-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-600" />
                  <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
                    Absen
                  </p>
                </div>
                <p className="text-2xl font-bold text-tp-text">{summary.total_absent}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-tp-border overflow-hidden">
            <div className="p-4 border-b border-tp-border">
              <h3 className="text-sm font-bold text-tp-text">
                Detail Kehadiran ({report.length} siswa)
              </h3>
            </div>

            {report.length === 0 ? (
              <div className="text-center py-12 text-tp-muted text-xs">
                <Users size={32} className="mx-auto mb-3 opacity-40" />
                <p>Belum ada data kehadiran.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-tp-border bg-gray-50 text-xs text-tp-muted uppercase tracking-wider">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Nama</th>
                      <th className="py-3 px-4">NISN</th>
                      <th className="py-3 px-4">Sub Kelas</th>
                      <th className="py-3 px-4">Status Datang</th>
                      <th className="py-3 px-4">Jam</th>
                      <th className="py-3 px-4">Status Pulang</th>
                      <th className="py-3 px-4">Jam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-border">
                    {report.map((r, idx) => (
                      <tr
                        key={r.student_id}
                        className={`hover:bg-gray-50 ${r.is_absent ? 'bg-red-50/30' : ''}`}
                      >
                        <td className="py-3 px-4 text-tp-muted">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-tp-text">
                          {r.student_name}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">{r.nisn || '-'}</td>
                        <td className="py-3 px-4 text-xs">{r.sub_class_name || '-'}</td>
                        <td className="py-3 px-4">{getStatusBadge(r.check_in_status)}</td>
                        <td className="py-3 px-4 text-xs font-mono">{r.check_in_time || '-'}</td>
                        <td className="py-3 px-4">{getStatusBadge(r.check_out_status)}</td>
                        <td className="py-3 px-4 text-xs font-mono">{r.check_out_time || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}