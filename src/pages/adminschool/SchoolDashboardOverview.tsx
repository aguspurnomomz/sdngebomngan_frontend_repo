import { useState, useEffect } from 'react'
import { ShieldCheck, AlertCircle, GraduationCap, UserCog } from 'lucide-react'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'

export default function SchoolDashboardOverview() {
  const [stats, setStats] = useState({
    students: { total: 0, male: 0, female: 0 },
    teachers: { total: 0, male: 0, female: 0 },
  })
  const [loading, setLoading] = useState(true)
  
  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await axios.get(`${API_URL}/api/school-admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        
        setStats({
          students: res.data.students || { total: 0, male: 0, female: 0 },
          teachers: res.data.teachers || { total: 0, male: 0, female: 0 },
        })
      } catch (error) {
        console.error('Gagal memuat statistik:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [API_URL])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-emerald-900 flex items-start gap-3">
        <AlertCircle size={20} className="text-tp-green shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-0.5">Selamat datang di Panel Admin Sekolah</p>
          <p className="text-emerald-700 text-xs leading-relaxed">
            Kelola tahun akademik, jenjang dan kehadiran.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card Total Guru */}
        <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase text-tp-muted">Total Guru Terdaftar</span>
            <UserCog size={20} className="text-tp-green" />
          </div>
          <h2 className="text-3xl font-bold text-tp-text">
            {loading ? '...' : stats.teachers.total}
          </h2>
          <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-tp-faint">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              L: {loading ? '-' : stats.teachers.male}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pink-500"></span>
              P: {loading ? '-' : stats.teachers.female}
            </span>
          </div>
        </div>

        {/* Card Total Siswa */}
        <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase text-tp-muted">Total Siswa Terdaftar</span>
            <GraduationCap size={20} className="text-tp-green" />
          </div>
          <h2 className="text-3xl font-bold text-tp-text">
            {loading ? '...' : stats.students.total}
          </h2>
          <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-tp-faint">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              L: {loading ? '-' : stats.students.male}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pink-500"></span>
              P: {loading ? '-' : stats.students.female}
            </span>
          </div>
        </div>

        {/* Card Status Lisensi */}
        <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase text-tp-muted">Status Lisensi</span>
            <ShieldCheck size={20} className="text-tp-green" />
          </div>
          <h2 className="text-xl font-bold text-emerald-600">Aktif</h2>
          <p className="text-xs text-tp-muted mt-1">Langganan institusi B2B</p>
        </div>
      </div>
    </div>
  )
}