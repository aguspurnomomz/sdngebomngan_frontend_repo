import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import teachpartnerIcon from '../assets/logo-new-version.png'

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

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  )
}

// function IconQrCode() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
//       <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z" />
//       <path d="M14 14h3v3h-3zM19 19v3h-3v-3zM14 22h3M22 14v3M19 14h3v3" />
//     </svg>
//   )
// }


function TeacherTypeBadge({ type }: { type: 'b2c' | 'b2b' | 'hybrid' }) {
  const styles: Record<string, string> = {
    b2c: 'bg-slate-100 text-slate-600',
    b2b: 'bg-blue-100 text-blue-700',
    hybrid: 'bg-purple-100 text-purple-700',
  }
  const labels: Record<string, string> = {
    b2c: 'B2C',
    b2b: 'B2B',
    hybrid: 'Hybrid',
  }
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

function IconExam() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h3" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6M23 11h-6" />
    </svg>
  )
}

export default function MainLayout({ 
  session, 
  teacherType = 'b2c', 
  schoolMemberships = [] 
}: MainLayoutProps) {                                              
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false) 
  const [isLoggingOut, setIsLoggingOut] = useState(false) 

  const email = session?.user?.email ?? ''
  const displayName = email.split('@')[0] || 'Guru'
  const initial = (email.charAt(0) || 'G').toUpperCase()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <IconHome /> },
    // { path: '/question-bank', label: 'Bank Soal', icon: <IconBook />, },
    { path: '/personal-exams', label: 'Ujian Personal', icon: <IconExam /> },
    { path: '/personal-students', label: 'Siswa Personal', icon: <IconUsers /> },
    { path: '/ebooks', label: 'Referensi E-Book', icon: <IconBook /> },
    // { path: '/exam-session', label: 'Ujian', icon: <IconQrCode />, badge: 'Test'},
    { path: '/billing', label: 'Beli Token', icon: <IconWallet />, },
    { path: '/profile', label: 'Identitas', icon: <IconSettings /> },
   
  ]

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        navigate('/', { replace: true })
      }
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/', { replace: true })
        }
      }
    )

    return () => subscription.unsubscribe()
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
      <button
        type="button"
        className={`fixed inset-0 z-40 border-0 bg-slate-900/40 p-0 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        aria-label="Tutup menu"
        onClick={closeSidebar}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-tp-border bg-tp-sidebar px-5 py-7 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-9 flex items-center gap-2.5 px-2">
          <img 
            src={teachpartnerIcon} 
            alt="TeachPartner" 
            className="h-8 w-auto object-contain"   
          />
        </div>

        <div className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-tp-faint">
          Menu
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {menuItems.map((item) => {
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
                {/* {item.badge ? (
                  <span className="ml-auto rounded-lg bg-tp-green px-[7px] py-0.5 text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null} */}
              </button>
            )
          })}
        </nav>

        {/* ← BARU: Daftar sekolah yang diikuti */}
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
                  title={`${m.school_name} (${m.role_in_school})`}
                >
                  <span 
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      m.is_active ? 'bg-tp-green' : 'bg-slate-300'
                    }`} 
                  />
                  <span className="flex-1 truncate text-tp-text">
                    {m.school_name}
                  </span>
                  <span className="shrink-0 text-[10px] capitalize text-tp-faint">
                    {m.role_in_school}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3.5">
          <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-tp-green to-[#1a6b4a] p-5 text-white">
            <div className="pointer-events-none absolute -top-10 -right-8 h-[140px] w-[140px] rounded-full bg-tp-mint/20" />
            <h4 className="relative mb-1.5 text-sm font-bold">Aplikasi Mobile</h4>
            <p className="relative mb-3.5 text-xs leading-snug text-white/75">
              Akses perangkat ajar & bank soal dari mana saja.
            </p>
            <button
              type="button"
              className="relative inline-flex w-full items-center justify-center rounded-xl bg-white px-3.5 py-2 text-[13px] font-semibold text-tp-green"
            >
              Download
            </button>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-[11px] text-sm font-medium text-tp-muted transition hover:bg-rose-50 hover:text-rose-600"
            onClick={() => setShowLogoutModal(true)}
          >
            <IconLogout />
            Keluar
          </button>
        </div>
      </aside>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          />
          
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <svg 
                className="h-8 w-8 text-rose-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
              Perhatian!
            </h3>
            <p className="mb-6 text-center text-sm text-gray-600">
              Halo {displayName}, apakah Anda yakin ingin keluar dari aplikasi?
              <br />
              <span className="text-xs text-gray-400">
                Jika ya, sesi akan berakhir.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Keluar...
                  </span>
                ) : (
                  'Ya, Keluar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[260px]">
        <header className="flex items-center gap-4 px-4 py-3 sm:px-7 sm:py-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-tp-border bg-white text-tp-text lg:hidden"
            aria-label="Buka menu"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <IconMenu />
          </button>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-tp-border bg-white text-tp-muted transition hover:bg-gray-50 hover:text-tp-text sm:inline-flex"
              aria-label="Pesan"
            >
              <IconMail />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-tp-border bg-white text-tp-muted transition hover:bg-gray-50 hover:text-tp-text"
              aria-label="Notifikasi"
            >
              <IconBell />
            </button>
            <div className="flex items-center gap-2.5 pl-1.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tp-green text-sm font-bold text-white">
                {initial}
              </div>
              <div className="hidden min-w-0 flex-col lg:flex">
                {/* ← UBAH: tambah badge tipe guru */}
                <div className="flex items-center gap-2">
                  <strong className="max-w-[160px] truncate text-[13px] font-bold text-tp-text">
                    {displayName}
                  </strong>
                  <TeacherTypeBadge type={teacherType} />
                </div>
                <span className="max-w-[160px] truncate text-xs text-tp-faint">
                  {email}
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className="w-full max-w-[1200px] px-4 pb-6 pt-2 sm:px-7 sm:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}