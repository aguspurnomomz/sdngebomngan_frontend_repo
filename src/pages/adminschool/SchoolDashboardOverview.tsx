import { Users, Building2, ShieldCheck, AlertCircle } from 'lucide-react'

export default function SchoolDashboardOverview() {
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
        <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase text-tp-muted">Total Guru Terdaftar</span>
            <Users size={20} className="text-tp-green" />
          </div>
          <h2 className="text-2xl font-bold text-tp-text">--</h2>
          <p className="text-xs text-tp-muted mt-1">Guru di bawah institusi Anda</p>
        </div>

        <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase text-tp-muted">Sesi Ujian Aktif</span>
            <Building2 size={20} className="text-tp-green" />
          </div>
          <h2 className="text-2xl font-bold text-tp-text">--</h2>
          <p className="text-xs text-tp-muted mt-1">Ujian sekolah berlangsung</p>
        </div>

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