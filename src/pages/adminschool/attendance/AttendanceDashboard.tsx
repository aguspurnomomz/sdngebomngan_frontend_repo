import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// import { Button } from '../../../components/ui/button'
import {
  Calendar,
  Clock,
  QrCode,
  Users,
  BarChart3,
  Layers,
  PlayCircle,
  CreditCard,  
  Monitor, 
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import axios from 'axios'

interface TodaySession {
  id: string
  title: string
  shift_name: string
  class_group_name: string
  session_date: string
  status: string
  total_check_in: number
  total_students: number
}

export default function AttendanceDashboard() {
  const navigate = useNavigate()
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalShifts: 0,
    totalActiveSessions: 0,
    totalStudents: 0,
  })

  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) return

      const headers = { Authorization: `Bearer ${token}` }

      const [shiftsRes, sessionsRes, studentsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/school-admin/attendance/shifts`, { headers }),
        axios.get(`${API_URL}/api/school-admin/attendance/sessions/today`, { headers }),
        axios.get(`${API_URL}/api/school-admin/students`, { headers }),
      ])

      const shiftsCount = shiftsRes.status === 'fulfilled'
        ? (shiftsRes.value.data?.shifts?.length ?? 0)
        : 0
      const activeSessions = sessionsRes.status === 'fulfilled'
        ? (sessionsRes.value.data?.sessions ?? [])
        : []
      const studentsCount = studentsRes.status === 'fulfilled'
        ? (studentsRes.value.data?.total ?? 0)
        : 0

      setTodaySessions(activeSessions)
      setStats({
        totalShifts: shiftsCount,
        totalActiveSessions: activeSessions.length,
        totalStudents: studentsCount,
      })
    } catch (error) {
      console.error('[AttendanceDashboard] Error:', error)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const quickActions = [
    {
      icon: <PlayCircle size={20} />,
      label: 'Absensi Hari Ini',
      desc: 'Buka & kelola sesi absensi',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      path: '/school-admin/dashboard/attendance/sessions',
    },
    {
      icon: <QrCode size={20} />,
      label: 'QR Code Siswa',
      desc: 'Generate & print kartu absensi',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      path: '/school-admin/dashboard/attendance/qr-codes',
    },
    {
      icon: <Clock size={20} />,
      label: 'Shift Absensi',
      desc: 'Kelola shift absensi',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      path: '/school-admin/dashboard/attendance/shifts',
    },
    {
      icon: <Calendar size={20} />,
      label: 'Kalender Akademik',
      desc: 'Atur hari libur & kegiatan sekolah',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      path: '/school-admin/dashboard/attendance/calendar',
    },
    {
      icon: <Layers size={20} />,
      label: 'Assign Shift',
      desc: 'Mapping kelas ke dalam pengaturan shift',
      color: 'bg-pink-50 text-pink-700 border-pink-200',
      path: '/school-admin/dashboard/attendance/assignments',
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Rekap Absensi',
      desc: 'Statistik & laporan Absensi',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      path: '/school-admin/dashboard/attendance/reports',
    },
        {
      icon: <CreditCard size={20} />,
      label: 'Kartu RFID',
      desc: 'Daftarkan & kelola kartu RFID siswa',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      path: '/school-admin/dashboard/attendance/rfid-cards',
    },
    {
      icon: <Monitor size={20} />,
      label: 'Device & Kiosk',
      desc: 'Kelola device kiosk absensi',
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      path: '/school-admin/dashboard/attendance/devices',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-tp-text">Manajemen Absensi</h1>
        <p className="text-xs text-tp-muted">
          Kelola sesi absensi, scan QR, dan pantau kehadiran siswa.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-tp-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Clock size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
                Total Shift Aktif
              </p>
              <p className="text-xl font-bold text-tp-text">{stats.totalShifts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-tp-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <PlayCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
                Sesi Hari Ini
              </p>
              <p className="text-xl font-bold text-tp-text">{stats.totalActiveSessions}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-tp-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">
                Total Siswa
              </p>
              <p className="text-xl font-bold text-tp-text">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-tp-text mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`text-left rounded-2xl border p-4 hover:shadow-md transition-all ${action.color}`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">{action.icon}</div>
                <div>
                  <p className="text-sm font-bold">{action.label}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">{action.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Sessions */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-tp-text">Sesi Absensi Hari Ini</h2>
          <button
            onClick={fetchData}
            className="text-[10px] text-tp-green font-medium hover:underline"
          >
            Muat Ulang
          </button>
        </div>

        {loading ? (
          <p className="text-center text-xs text-tp-muted py-8">Memuat sesi...</p>
        ) : todaySessions.length === 0 ? (
          <div className="text-center py-12 text-tp-muted text-xs">
            <PlayCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-tp-text mb-1">Belum Ada Sesi Hari Ini</p>
            <p>Buka sesi absensi baru untuk memulai.</p>
            <button
              onClick={() => navigate('/school-admin/dashboard/attendance/sessions')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
            >
              <PlayCircle size={14} />
              Buka Sesi Absensi
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-4 border border-tp-border rounded-xl hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-semibold text-tp-text">{sess.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-tp-muted">
                    <span>{sess.shift_name}</span>
                    <span>•</span>
                    <span>{sess.class_group_name}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} />
                      {sess.total_check_in}/{sess.total_students}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/school-admin/dashboard/attendance/scanner/${sess.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-3 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover"
                >
                  <QrCode size={14} />
                  Mulai Scan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}