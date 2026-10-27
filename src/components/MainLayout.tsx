import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import skoolagoIcon from '../assets/logo-new-version.png'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Users,
  GraduationCap,
  CalendarClock,
} from 'lucide-react'
import CrispChat from './CrispChat'
import { useAuth } from '../contexts/AuthContext'

type Membership = {
  school_id: string
  school_name: string
  role_in_school: string
  is_active: boolean
}

type MainLayoutProps = {
  session: any
  teacherType?: 'b2c' | 'b2b' | 'hybrid'
  schoolMemberships?: Membership[]
}

// [FIX] Tipe menu eksplisit supaya TS tidak komplain saat spread conditional
type MenuChild = {
  path: string
  label: string
  icon: React.ReactNode
}

type MenuGroup = {
  key: string
  label: string
  icon: React.ReactNode
  children: MenuChild[]
}

export default function MainLayout({
  session,
  schoolMemberships = [],
}: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const email = session?.user?.email ?? ''
  const displayName = email.split('@')[0] || 'Guru'
  const initial = (email.charAt(0) || 'G').toUpperCase()

  const { hasPermission } = useAuth()

  // [FIX] Menu grup dengan tipe eksplisit + menu "Kelola Ujian"
  const groupedMenu: MenuGroup[] = [
    {
      key: 'guru',
      label: 'Menu Utama',
      icon: <LayoutDashboard size={18} />,
      children: [
        { path: '/', label: 'Beranda', icon: <LayoutDashboard size={14} /> },
        { path: '/ebooks', label: 'Referensi E-Book', icon: <BookOpen size={14} /> },
      ],
    },
    ...(hasPermission('student.read')
      ? [
          {
            key: 'kelas',
            label: 'Data Kelas & Siswa',
            icon: <Users size={18} />,
            children: [
              { path: '/students', label: 'Kelola Siswa', icon: <GraduationCap size={14} /> },
              { path: '/classes', label: 'Kelola Kelas', icon: <Users size={14} /> },
            ],
          },
        ]
      : []),
    // [FIX] Menu Kelola Ujian — sama seperti di Admin Sekolah
    ...(hasPermission('exam.read')
      ? [
          {
            key: 'ujian',
            label: 'Kelola Ujian',
            icon: <FileText size={18} />,
            children: [
              { path: '/exams', label: 'Soal Ujian', icon: <FileText size={14} /> },
              {
                path: '/exam-schedules',
                label: 'Jadwal Ujian',
                icon: <CalendarClock size={14} />,
              },
            ],
          },
        ]
      : []),
  ]

  const [expandedMenus, setExpandedMenus] = useState<string[]>(['guru'])

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // [FIX] Auto-expand grup menu sesuai path aktif
  useEffect(() => {
    const p = location.pathname
    const toOpen: string[] = []

    if (p.startsWith('/exams') || p.startsWith('/exam-schedules')) {
      toOpen.push('ujian')
    }
    if (p.startsWith('/students') || p.startsWith('/classes')) {
      toOpen.push('kelas')
    }

    if (toOpen.length === 0) return

    setExpandedMenus((prev) => {
      const alreadyOpen = toOpen.every((k) => prev.includes(k))
      if (alreadyOpen) return prev
      return Array.from(new Set([...prev, ...toOpen]))
    })
  }, [location.pathname])

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      if (!currentSession) {
        navigate('/', { replace: true })
      }
    }
    checkSession()
  }, [navigate])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      setShowLogoutModal(false)
    } catch (error) {
      console.error('Error logout:', error)
      setIsLoggingOut(false)
    }
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-tp-bg">
      <CrispChat />
      <button
        type="button"
        className={`fixed inset-0 z-40 border-0 bg-slate-900/40 p-0 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        aria-label="Tutup menu"
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-tp-border bg-tp-sidebar px-5 py-7 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-9 flex items-center gap-2.5 px-2">
          <img src={skoolagoIcon} alt="SkoolaGo" className="h-8 w-auto object-contain" />
        </div>

        <div className="mb-9 flex items-center gap-2.5 px-2">
          <span className="font-bold text-tp-text text-sm">Portal Guru</span>
        </div>

        <div className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-tp-faint">
          Menu
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {groupedMenu.map((item) => {
            const isExpanded = expandedMenus.includes(item.key)
            const hasActiveChild =
              item.children?.some((c) => location.pathname === c.path) ?? false

            return (
              <div key={item.key}>
                <button
                  type="button"
                  className={`relative flex w-full items-center gap-3 rounded-[10px] px-3 py-[11px] text-left text-sm transition ${
                    hasActiveChild
                      ? 'font-semibold text-tp-green'
                      : 'font-medium text-tp-muted hover:bg-tp-green/5 hover:text-tp-text'
                  }`}
                  onClick={() => toggleMenu(item.key)}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {isExpanded && (
                  <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-tp-border pl-2">
                    {item.children?.map((child) => {
                      const childActive = location.pathname === child.path
                      return (
                        <button
                          key={child.path}
                          type="button"
                          className={`relative flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[13px] transition ${
                            childActive
                              ? 'font-semibold text-tp-green bg-tp-green/5'
                              : 'font-medium text-tp-muted hover:bg-tp-green/5 hover:text-tp-text'
                          }`}
                          onClick={() => {
                            navigate(child.path)
                            closeSidebar()
                          }}
                        >
                          {child.icon}
                          {child.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Daftar Sekolah yang diikuti */}
        {schoolMemberships.length > 0 && (
          <div className="mt-3 mb-3 rounded-xl border border-tp-border bg-white p-3">
            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-tp-faint">
              Sekolah Saya
            </div>
            <div className="flex max-h-[180px] flex-col gap-1 overflow-y-auto">
              {schoolMemberships.map((m) => (
                <div
                  key={m.school_id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      m.is_active ? 'bg-tp-green' : 'bg-slate-300'
                    }`}
                  />
                  <span className="flex-1 truncate text-tp-text">{m.school_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3.5">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-[11px] text-sm font-medium text-tp-muted transition hover:bg-rose-50 hover:text-rose-600"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Modal Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
              Perhatian!
            </h3>
            <p className="mb-6 text-center text-sm text-gray-600">
              Halo {displayName}, apakah Anda yakin ingin keluar?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                {isLoggingOut ? 'Keluar...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout Utama Kanan */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[260px]">
        <header className="flex items-center gap-4 px-4 py-3 sm:px-7 sm:py-4 bg-white border-b border-tp-border">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-tp-border bg-white text-tp-text lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 pl-1.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tp-green text-sm font-bold text-white">
                {initial}
              </div>
              <div className="hidden min-w-0 flex-col lg:flex">
                <strong className="max-w-[160px] truncate text-[13px] font-bold text-tp-text">
                  {displayName}
                </strong>
                <span className="text-[11px] text-tp-faint">Guru</span>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1200px] px-4 pb-6 pt-6 sm:px-7 sm:pb-8">
          <Outlet />
        </main>

        <footer className="w-full max-w-[1200px] px-4 pb-6 sm:px-7 sm:pb-8">
          <div className="border-t border-tp-border pt-6 text-center text-xs text-tp-muted">
            Copyright © 2025 - 2026 SkoolaGo. All Rights Reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}