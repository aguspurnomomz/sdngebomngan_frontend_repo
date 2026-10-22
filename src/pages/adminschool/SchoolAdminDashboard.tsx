import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import skoolagoIcon from '../../assets/logo-new-version.png'
import sdngembonganIcon from '../../assets/logo_gembongan.png'
import CrispChat from '../../components/CrispChat'
import {
  Users, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  Calendar, 
  CalendarClock,
  LayoutDashboard, 
  GraduationCap, 
  // ClipboardCheck, 
  FileText,
  UserCog,
  ChevronDown, 
  ChevronRight,
  CalendarDays, 
  Clock,
  BookOpen
} from 'lucide-react'

type MenuItem = {
  path: string
  label: string
  icon: React.ReactNode
  children?: MenuItem[]
}

export default function SchoolAdminDashboard({ session }: { session: any }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
  const initial: string[] = []

  if (
    location.pathname.startsWith('/school-admin/dashboard/exams') ||
    location.pathname.startsWith('/school-admin/dashboard/exam-schedules')
  ) {
    initial.push('exam-group')
  }

  if (
    location.pathname.startsWith('/school-admin/dashboard/time-slots') ||
    location.pathname.startsWith('/school-admin/dashboard/timetables')
  ) {
    initial.push('timetable-group')
  }

  if (
    location.pathname.startsWith('/school-admin/dashboard/classes') ||
    location.pathname.startsWith('/school-admin/dashboard/students')
  ) {
    initial.push('class-group')
  }

  return initial
})

  const email = session?.user?.email ?? 'Admin Sekolah'
  const displayName = email.split('@')[0] || 'Admin'
  //const initial = (email.charAt(0) || 'A').toUpperCase()

  const menuItems: MenuItem[] = [
  {
    path: '/school-admin/dashboard',
    label: 'Beranda',
    icon: <LayoutDashboard size={18} />,
  },
  {
    path: '/school-admin/dashboard/school',
    label: 'Data Sekolah',
    icon: <Building2 size={18} />,
  },
  {
    path: '/school-admin/dashboard/academic-years',
    label: 'Tahun Akademik',
    icon: <Calendar size={18} />,
  },
  {
    path: '/school-admin/dashboard/teachers',
    label: 'Manajemen Guru',
    icon: <UserCog size={18} />,
  },
  {
    path: '/school-admin/dashboard/subjects',
    label: 'Mata Pelajaran',
    icon: <BookOpen size={18} />,
  },
  {
    path: 'timetable-group',
    label: 'Jadwal Pelajaran',
    icon: <CalendarDays size={18} />,
    children: [
      {
        path: '/school-admin/dashboard/time-slots',
        label: 'Pengaturan Jam',
        icon: <Clock size={14} />,
      },
      {
        path: '/school-admin/dashboard/timetables',
        label: 'Buat Jadwal Baru',
        icon: <CalendarDays size={14} />,
      },
    ],
  },
  {
    path: 'class-group',
    label: 'Manajemen Kelas',
    icon: <Users size={18} />,
    children: [
      {
        path: '/school-admin/dashboard/classes',
        label: 'Kelola Kelas',
        icon: <Users size={14} />,
      },
      {
        path: '/school-admin/dashboard/students',
        label: 'Kelola Siswa',
        icon: <GraduationCap size={14} />,
      },
    ],
  },
  {
    path: 'exam-group',
    label: 'Kelola Ujian',
    icon: <FileText size={18} />,
    children: [
      {
        path: '/school-admin/dashboard/exams',
        label: 'Soal Ujian',
        icon: <FileText size={14} />,
      },
      {
        path: '/school-admin/dashboard/exam-schedules',
        label: 'Jadwal Ujian',
        icon: <CalendarClock size={14} />,
      },
    ],
  },
]

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const isChildActive = (children: MenuItem[]) =>
    children.some((c) => location.pathname.startsWith(c.path))

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        navigate('/', { replace: true })
      }
    }
    checkSession()
  }, [navigate])

  // Auto-expand grup menu sesuai path aktif
  useEffect(() => {
    const p = location.pathname
    const toOpen: string[] = []

    if (
      p.startsWith('/school-admin/dashboard/exams') ||
      p.startsWith('/school-admin/dashboard/exam-schedules')
    ) {
      toOpen.push('exam-group')
    }

    if (
      p.startsWith('/school-admin/dashboard/time-slots') ||
      p.startsWith('/school-admin/dashboard/timetables')
    ) {
      toOpen.push('timetable-group')
    }

    if (
      p.startsWith('/school-admin/dashboard/classes') ||
      p.startsWith('/school-admin/dashboard/students')
    ) {
      toOpen.push('class-group')
    }

    if (toOpen.length === 0) return

    setExpandedMenus((prev) => {
      // kalau semua sudah terbuka, kembalikan reference yang sama
      // supaya tidak trigger re-render
      const alreadyOpen = toOpen.every((k) => prev.includes(k))
      if (alreadyOpen) return prev
      const merged = new Set([...prev, ...toOpen])
      return Array.from(merged)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Gagal keluar:', error)
      setIsLoggingOut(false)
    }
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-tp-bg">
      <CrispChat />
      <button
        type="button"
        className={`fixed inset-0 z-40 border-0 bg-slate-900/40 p-0 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
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
          <img
            src={skoolagoIcon}
            alt="SkoolaGo"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="mb-9 flex items-center gap-2.5 px-2">
          <span className="font-bold text-tp-text text-sm">Panel Admin Sekolah</span>
        </div>

        <div className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-tp-faint">
          Menu Sidebar
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.children && item.children.length > 0) {
              const isExpanded = expandedMenus.includes(item.path)
              const hasActiveChild = isChildActive(item.children)

              return (
                <div key={item.path}>
                  {/* Parent button */}
                  <button
                    type="button"
                    className={`relative flex w-full items-center gap-3 rounded-[10px] px-3 py-[11px] text-left text-sm transition ${
                      hasActiveChild
                        ? 'font-semibold text-tp-green'
                        : 'font-medium text-tp-muted hover:bg-tp-green/5 hover:text-tp-text'
                    }`}
                    onClick={() => toggleMenu(item.path)}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>

                  {/* Children */}
                  {isExpanded && (
                    <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-tp-border pl-2">
                      {item.children.map((child) => {
                        const childActive = location.pathname.startsWith(child.path)
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
            }

            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                type="button"
                className={`relative flex w-full items-center gap-3 rounded-[10px] px-3 py-[11px] text-left text-sm transition ${
                  active
                    ? 'font-semibold text-tp-green before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-r before:bg-tp-green'
                    : 'font-medium text-tp-muted hover:bg-tp-green/5 hover:text-tp-text'
                }`}
                onClick={() => {
                  navigate(item.path)
                  closeSidebar()
                }}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

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
              Keluar Sistem
            </h3>
            <p className="mb-6 text-center text-sm text-gray-600">
              Apakah Anda yakin ingin keluar dari Panel Admin Sekolah?
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
            <Building2 size={20} />
          </button>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 pl-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
                <img src={sdngembonganIcon} alt="Profile" className="h-full w-full object-contain" />
              </div>
              <div className="hidden min-w-0 flex-col lg:flex">
                <strong className="max-w-[160px] truncate text-[13px] font-bold text-tp-text">
                  {displayName}
                </strong>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <ShieldCheck size={12} /> Admin Sekolah
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1200px] px-4 pb-6 pt-6 sm:px-7 sm:pb-8">
          <Outlet />
        </main>
             {/* footer */}
        <footer className="w-full max-w-[1200px] px-4 pb-6 sm:px-7 sm:pb-8">
          <div className="border-t border-tp-border pt-6 text-center text-xs text-tp-muted">
            Copyright © 2025 - 2026 SkoolaGo. All Rights Reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}