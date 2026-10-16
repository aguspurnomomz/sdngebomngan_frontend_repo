import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/axios' 

import teachpartnerIcon from '../../assets/logo-new-version.png'
import SuperAdminEbooks from './SuperAdminEbooks'
import SuperAdminUsers from './SuperAdminUsers'
import SuperAdminSecurity from './SuperAdminSecurity'
import SuperAdminSchools from './SuperAdminSchools'

import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Menu, 
  LogOut, 
  RefreshCw, 
  Building2
} from 'lucide-react'

interface Membership {
  school_id: string
  school_name: string
  school_active: boolean
  role_in_school: string
}

interface UserItem {
  id: string
  nama_guru: string
  nip_guru: string
  nama_sekolah: string
  mata_pelajaran: string
  token_balance: number
  is_active: boolean
  last_login: string | null
  updated_at: string
  teacher_type: 'b2c' | 'b2b' | 'hybrid'   
  memberships: Membership[]                 
}

interface LogItem {
  id: number
  email: string
  action: string
  ip_address: string
  user_agent: string
  details: string
  created_at: string
}

interface SuperAdminDashboardProps {
  adminName: string
  onLogout: () => void
}

type AdminView = 'dashboard' | 'users' | 'schools' | 'ebooks' | 'security'

export default function SuperAdminDashboard({ adminName, onLogout }: SuperAdminDashboardProps) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeView, setActiveView] = useState<AdminView>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initial = (adminName?.charAt(0) || 'S').toUpperCase()

  const fetchRegisteredUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('superadmin_token')
      const res = await api.get('/api/superadmin/registered-users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data.users || [])
      setErrorMsg('')
    } catch (err: any) {
      setErrorMsg('Gagal memuat data pengguna.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('superadmin_token')
      const res = await api.get('/api/superadmin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLogs(res.data.logs || [])
    } catch (err) {
      console.error('Gagal memuat log aktivitas:', err)
    }
  }

  useEffect(() => {
    fetchRegisteredUsers()
    fetchLogs()
  }, [])

  const stats = useMemo(() => {
    const active = users.filter((u) => u.is_active).length
    const blocked = users.length - active
    const tokens = users.reduce((sum, u) => sum + (Number(u.token_balance) || 0), 0)
    return { total: users.length, active, blocked, tokens }
  }, [users])

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'users' as const, label: 'User Guru', icon: <Users size={18} />, badge: String(stats.total) },
    { id: 'ebooks' as const, label: 'Kelola E-Book', icon: <BookOpen size={18} /> },
    { id: 'schools' as const, label: 'Kelola Sekolah', icon: <Building2 size={18} /> },
    { id: 'security' as const, label: 'Keamanan & Log', icon: <ShieldCheck size={18} /> },
  ]

  const openView = (view: AdminView) => {
    setActiveView(view)
    setSidebarOpen(false)
    if (view === 'users') fetchRegisteredUsers()
    if (view === 'security') fetchLogs()
  }

  return (
    <div className="flex min-h-screen bg-tp-bg">
      <button
        type="button"
        className={`fixed inset-0 z-40 border-0 bg-slate-900/40 p-0 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        aria-label="Tutup menu"
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-tp-border bg-tp-sidebar px-5 py-7 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-9 flex items-center gap-2.5 px-2">
          <img src={teachpartnerIcon} alt="TeachPartner" className="h-7 w-auto object-contain" />
        </div>

        <div className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-tp-faint">
          Menu Superadmin
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {menuItems.map((item) => {
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`relative flex w-full items-center gap-3 rounded-[10px] px-3 py-[11px] text-left text-sm transition ${
                  active
                    ? 'font-semibold text-tp-green before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-r before:bg-tp-green'
                    : 'font-medium text-tp-muted hover:bg-tp-green/5 hover:text-tp-text'
                }`}
                onClick={() => openView(item.id)}
              >
                {item.icon}
                {item.label}
                {item.badge && item.id === 'users' ? (
                  <span className="ml-auto rounded-lg bg-tp-green px-[7px] py-0.5 text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto">
          <Button
            type="button"
            variant="ghost"
            className="flex w-full justify-start items-center gap-2.5 rounded-[10px] px-3 py-[11px] text-sm font-medium text-tp-muted hover:bg-rose-50 hover:text-rose-600"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Keluar
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[260px]">
        <header className="flex items-center gap-4 px-4 py-3 sm:px-7 sm:py-4">
          <Button
            type="button"
            variant="outline"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-tp-border bg-white text-tp-text lg:hidden p-0"
            aria-label="Buka menu"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Menu size={20} />
          </Button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-tp-faint">Superadmin Panel</p>
            <h2 className="text-sm font-bold text-tp-text sm:text-base">
              {activeView === 'dashboard'
                ? 'Dashboard'
                : activeView === 'users'
                ? 'User Guru Terdaftar'
                : activeView === 'ebooks'
                ? 'Kelola E-Book Referensi'
                : 'Keamanan & Log'}
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tp-green text-sm font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0 flex-col">
                <strong className="block max-w-[160px] truncate text-[13px] font-bold text-tp-text">
                  {adminName || 'Superadmin'}
                </strong>
                <span className="text-xs text-tp-faint">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1200px] px-4 pb-6 pt-2 sm:px-7 sm:pb-8 space-y-6">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {activeView === 'dashboard' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text sm:text-[28px]">Dashboard</h1>
                  <p className="text-sm text-tp-muted">Ringkasan aktivitas dan pengguna sistem TeachPartner.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchRegisteredUsers()}
                  className="rounded-xl border-tp-border bg-white gap-2"
                >
                  <RefreshCw size={14} /> Muat Ulang
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="flex min-h-[120px] flex-col gap-2 rounded-2xl border border-tp-green bg-tp-green p-5 text-white shadow-sm sm:min-h-[140px]">
                  <span className="text-[13px] font-medium text-white/80">User Terdaftar</span>
                  <div className="text-[32px] font-bold leading-none tracking-tight text-white">
                    {loading ? '—' : stats.total}
                  </div>
                  <div className="mt-auto text-xs text-white/70">Total guru di sistem</div>
                </div>

                <div className="flex min-h-[120px] flex-col gap-2 rounded-2xl border border-tp-border bg-white p-5 shadow-sm sm:min-h-[140px]">
                  <span className="text-[13px] font-medium text-tp-muted">Akun Aktif</span>
                  <div className="text-[32px] font-bold leading-none tracking-tight text-tp-text">
                    {loading ? '—' : stats.active}
                  </div>
                  <div className="mt-auto text-xs text-tp-faint">Bisa login ke platform</div>
                </div>

                <div className="flex min-h-[120px] flex-col gap-2 rounded-2xl border border-tp-border bg-white p-5 shadow-sm sm:min-h-[140px]">
                  <span className="text-[13px] font-medium text-tp-muted">Total Token</span>
                  <div className="text-[32px] font-bold leading-none tracking-tight text-tp-text">
                    {loading ? '—' : stats.tokens}
                  </div>
                  <div className="mt-auto text-xs text-tp-faint">Saldo AI seluruh guru</div>
                </div>
              </div>
            </div>
          ) : activeView === 'users' ? (
            <SuperAdminUsers users={users} loading={loading} onRefresh={fetchRegisteredUsers} />
          ) : activeView === 'schools' ? (
            <SuperAdminSchools />
          ) : activeView === 'ebooks' ? (
            <SuperAdminEbooks />
          ) : (
            <SuperAdminSecurity logs={logs} onRefreshLogs={fetchLogs} />
          )}
        </main>
      </div>
    </div>
  )
}