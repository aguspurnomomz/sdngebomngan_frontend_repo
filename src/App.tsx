import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import axios from 'axios'

// [OLD] Di-comment karena sudah digantikan oleh GuruLoginPage & AdminSchoolLoginPage
// import LoginPage  from './pages/LoginPage'

// [NEW] Test yang baru — 2 halaman login terpisah
import GuruLoginPage from './pages/auth/GuruLoginPage'
import AdminSchoolLoginPage from './pages/auth/AdminSchoolLoginPage'

import RegisterPage from './pages/RegisterPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import DisclaimerPage from './pages/DisclaimerPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import UpdatePasswordPage from './pages/UpdatePasswordPage'

import MainLayout from './components/MainLayout'
import DashboardOverview from './pages/userteacher/DashboardOverview'
import QuestionBankPage from './pages/userteacher/QuestionBankPage'
import ProfilePage from './pages/userteacher/ProfilePage'
import EbooksPage from './pages/userteacher/EbooksPage'
import BillingPage from './pages/userteacher/BillingPage'
import ExamSessionPage from './pages/userteacher/ExamSessionPage'

import TakeSchoolExamPage from './pages/studentexam/TakeSchoolExamPage'
import TakePersonalExamPage from './pages/studentexam/TakePersonalExamPage'

import SuperAdminLoginPage from './pages/superadmin/SuperAdminLoginPage'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SuperAdminEbooks from './pages/superadmin/SuperAdminEbooks'

import SchoolAdminDashboard from './pages/adminschool/SchoolAdminDashboard'
import SchoolDashboardOverview from './pages/adminschool/SchoolDashboardOverview'
import SchoolAcademicYearPage from './pages/adminschool/SchoolAcademicYearPage'
import SchoolProfilePage from './pages/adminschool/SchoolProfilePage'
import ClassManagementPage from './pages/adminschool/ClassManagementPage'
import StudentManagementPage from './pages/adminschool/StudentManagementPage'
import SchoolInactivePage from './pages/adminschool/SchoolInactivePage'

import AttendanceDashboard from './pages/adminschool/attendance/AttendanceDashboard'
import ShiftManagementPage from './pages/adminschool/attendance/ShiftManagementPage'
import CalendarManagementPage from './pages/adminschool/attendance/CalendarManagementPage'
import ShiftAssignmentPage from './pages/adminschool/attendance/ShiftAssignmentPage'
import QrCodeManagementPage from './pages/adminschool/attendance/QrCodeManagementPage'
import AttendanceSessionPage from './pages/adminschool/attendance/AttendanceSessionPage'
import AttendanceScannerPage from './pages/adminschool/attendance/AttendanceScannerPage'
import AttendanceReportPage from './pages/adminschool/attendance/AttendanceReportPage'

import RfidCardManagementPage from './pages/adminschool/attendance/RfidCardManagementPage'
import DeviceManagementPage from './pages/adminschool/attendance/DeviceManagementPage'
import KioskPage from './pages/kiosk/KioskPage'

import ExamListPage from './pages/adminschool/exams/ExamListPage'
import CreateExamPage from './pages/adminschool/exams/CreateExamPage'
import EditExamPage from './pages/adminschool/exams/EditExamPage'
import ExamDetailPage from './pages/adminschool/exams/ExamDetailPage'

import ExamSchedulePage from './pages/adminschool/exams/ExamSchedulePage'
import CreateExamSchedulePage from './pages/adminschool/exams/CreateExamSchedulePage'
import ExamMonitorPage from './pages/adminschool/exams/ExamMonitorPage'

import ExamScheduleDetailPage from './pages/adminschool/exams/ExamScheduleDetailPage'
import ExamGradesPage from './pages/adminschool/exams/ExamGradesPage'
import ExamSubmissionDetailPage from './pages/adminschool/exams/ExamSubmissionDetailPage'
import PersonalExamListPage from './features/personal-exam/pages/PersonalExamListPage'

import PersonalExamCreatePage from './features/personal-exam/pages/PersonalExamCreatePage'
import PersonalExamDetailPage from './features/personal-exam/pages/PersonalExamDetailPage'
import PersonalExamParticipantsPage from './features/personal-exam/pages/PersonalExamParticipantsPage'
import PersonalStudentManagementPage from './features/personal-exam/pages/PersonalStudentManagementPage'

import PersonalExamQrSheetPage from './features/personal-exam/pages/PersonalExamQrSheetPage'

// import TakePersonalExamPage from './pages/studentexam/TakePersonalExamPage'

const ROLE_CACHE_KEY = 'tp_role_cache_v1'
const ROLE_CACHE_TTL_MS = 5 * 60 * 1000

type CachedRole = {
  userId: string
  role: string
  teacher_type: 'b2c' | 'b2b' | 'hybrid'
  memberships: any[]
  school_inactive: boolean
  token_balance?: number
  cachedAt: number
}

function readRoleCache(userId: string): CachedRole | null {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_KEY)

    if (!raw) return null
    const cached: CachedRole = JSON.parse(raw)
    if (cached.userId !== userId) return null
    if (Date.now() - cached.cachedAt > ROLE_CACHE_TTL_MS) {
      localStorage.removeItem(ROLE_CACHE_KEY)
      return null
    }
    return cached
  } catch {
    return null
  }
}

// Local Storage
function writeRoleCache(data: CachedRole) {
  try {
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota error
  }
}

// Local Storage
function clearRoleCache() {
  try {
    localStorage.removeItem(ROLE_CACHE_KEY)
  } catch {
    // ignore
  }
}

// let lastProfileTokenFetched: string | null = null

export default function App() {
  console.log('[App] MOUNT / RENDER — waktu:', new Date().toISOString())
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [checkingRole, setCheckingRole] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [schoolInactive, setSchoolInactive] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem('superadmin_token')
  )
  const [adminName, setAdminName] = useState<string>(
    localStorage.getItem('superadmin_name') || ''
  )
  const [teacherType, setTeacherType] = useState<'b2c' | 'b2b' | 'hybrid'>('b2c')
  const [schoolMemberships, setSchoolMemberships] = useState<any[]>([])
  const [authError, setAuthError] = useState<string | null>(null)
  const API_URL = import.meta.env.VITE_API_URL
  const lastFetchedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let bootResolved = false

    const markBootDone = () => {
      if (bootResolved) return
      bootResolved = true
      if (!cancelled) setLoading(false)
    }

    let fetchInFlight = false

    const checkRoleAndFetchData = async (
      token: string,
      userId: string,
      force = false
    ) => {
      if (!token || !userId) return

      // Kalau ada fetch lain sedang jalan untuk user yang sama, skip
      if (fetchInFlight && lastFetchedUserIdRef.current === userId) {
        console.log('[check-role] SKIP — fetch lain sedang berjalan')
        return
      }

      if (!force) {
        const cached = readRoleCache(userId)
        if (cached) {
          console.log('[check-role] SKIP — pakai cache localStorage')
          if (!cancelled) {
            setUserRole(cached.role)
            setSchoolInactive(cached.school_inactive)
            if (cached.role === 'teacher') {
              setTeacherType(cached.teacher_type)
              setSchoolMemberships(cached.memberships || [])
              if (typeof cached.token_balance === 'number') {
                setTokenBalance(cached.token_balance)
              }
            }
          }
          lastFetchedUserIdRef.current = userId

          // Cache legacy (belum ada token_balance) — fetch sekali lalu update cache
          if (cached.role === 'teacher' && typeof cached.token_balance !== 'number') {
            fetchInFlight = true
            try {
              const res = await axios.get(`${API_URL}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              const bal = res.data.token_balance ?? 0
              if (!cancelled) setTokenBalance(bal)
              writeRoleCache({ ...cached, token_balance: bal })
            } catch (e) {
              console.error('Gagal memuat profile (cache legacy):', e)
            } finally {
              fetchInFlight = false
            }
          }
          return
        }
      }

      console.log('[check-role] FETCH dari backend')
      if (!cancelled) setCheckingRole(true)
      if (!cancelled) setAuthError(null)

      fetchInFlight = true
      try {
        const roleRes = await axios.get(`${API_URL}/api/auth/check-role`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const role = roleRes.data.role
        const isSchoolInactive = roleRes.data.school_inactive === true
        const tType = roleRes.data.teacher_type || 'b2c'
        const memberships = roleRes.data.memberships || []

        if (!cancelled) {
          setUserRole(role)
          setSchoolInactive(isSchoolInactive)
        }

        let tokenBalance: number | undefined

        if (role === 'teacher') {
          if (!cancelled) {
            setTeacherType(tType)
            setSchoolMemberships(memberships)
          }

          try {
            const res = await axios.get(`${API_URL}/api/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const bal: number = res.data.token_balance ?? 0
            if (!cancelled) setTokenBalance(bal)
            tokenBalance = bal
          } catch (e) {
            console.error('Gagal memuat profile:', e)
            tokenBalance = 0
          }
        }

        writeRoleCache({
          userId,
          role,
          teacher_type: tType,
          memberships,
          school_inactive: isSchoolInactive,
          token_balance: tokenBalance,
          cachedAt: Date.now(),
        })
        lastFetchedUserIdRef.current = userId
      } catch (e: any) {
        console.error('Gagal memuat data sesi:', e)
        if (!cancelled) setAuthError(e.response?.data?.error || e.message)
        lastFetchedUserIdRef.current = null
        clearRoleCache()
      } finally {
        fetchInFlight = false
        if (!cancelled) setCheckingRole(false)
      }
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        setSession(session)
        if (session?.user) {
          // Tandai userId sudah diambil supaya onAuthStateChange
          // tidak double fetch
          lastFetchedUserIdRef.current = session.user.id
          checkRoleAndFetchData(session.access_token, session.user.id, false).finally(
            markBootDone
          )
        } else {
          markBootDone()
        }
      })
      .catch(() => {
        markBootDone()
      })

    // Fallback: kalau getSession hang > 3 detik, tetap matikan loading
    const fallbackTimer = setTimeout(markBootDone, 3000)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_IN') {
        setSession(session)
        if (session?.user) {
          // Kalau getSession() sudah handle user ini, skip
          if (lastFetchedUserIdRef.current === session.user.id) {
            console.log('[auth] SIGNED_IN — sudah di-handle getSession, skip')
            return
          }

          const cached = readRoleCache(session.user.id)
          const isRestore = !!cached

          if (isRestore) {
            console.log('[auth] SIGNED_IN (restore session) — pakai cache')
            lastFetchedUserIdRef.current = session.user.id
            checkRoleAndFetchData(session.access_token, session.user.id, false)
          } else {
            console.log('[auth] SIGNED_IN (login baru) — force fetch')
            lastFetchedUserIdRef.current = null
            clearRoleCache()
            checkRoleAndFetchData(session.access_token, session.user.id, true)
          }
        }
        return
      }

      if (event === 'SIGNED_OUT') {
        lastFetchedUserIdRef.current = null
        clearRoleCache()
        setSession(null)
        setUserRole(null)
        setTokenBalance(0)
        setSchoolInactive(false)
        setTeacherType('b2c')
        setSchoolMemberships([])
        setAuthError(null)
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('[auth] TOKEN_REFRESHED — skip check-role')
        setSession(session)
        return
      }

      if (event === 'USER_UPDATED') {
        setSession(session)
        return
      }

      if (event === 'INITIAL_SESSION') {
        return
      }

      setSession(session)
    })

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [API_URL])

  const handleAdminLogout = () => {
    localStorage.removeItem('superadmin_token')
    localStorage.removeItem('superadmin_name')
    setAdminToken(null)
    setAdminName('')
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center font-sans text-tp-muted">
        Memuat aplikasi...
      </div>
    )
  }

  return (
    <Routes>
      {/* --- Route Superadmin --- */}
      <Route
        path="/superadmin/login"
        element={
          adminToken ? (
            <Navigate to="/superadmin/dashboard" replace />
          ) : (
            <SuperAdminLoginPage
              onLoginSuccess={(token, name) => {
                setAdminToken(token)
                setAdminName(name)
              }}
            />
          )
        }
      />
      <Route
        path="/superadmin/dashboard"
        element={
          adminToken ? (
            <SuperAdminDashboard adminName={adminName} onLogout={handleAdminLogout} />
          ) : (
            <Navigate to="/superadmin/login" replace />
          )
        }
      />
      <Route
        path="/superadmin/ebooks"
        element={
          adminToken ? <SuperAdminEbooks /> : <Navigate to="/superadmin/login" replace />
        }
      />

      {/* ============================================================
          [NEW] Route Login Guru — 2 tab (Individual & Sekolah)
          ============================================================ */}
      <Route
        path="/login/guru"
        element={
          !session ? (
            <GuruLoginPage />
          ) : authError ? (
            <div className="grid min-h-screen place-items-center text-center p-6">
              <div>
                <h2 className="text-lg font-bold text-tp-text mb-2">Gagal memuat akun</h2>
                <p className="text-sm text-tp-muted mb-4">{authError}</p>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          ) : checkingRole || userRole === null ? (
            <div className="grid min-h-screen place-items-center font-sans text-tp-muted">
              Memverifikasi akun...
            </div>
          ) : userRole === 'school_admin' ? (
            schoolInactive ? (
              <SchoolInactivePage />
            ) : (
              <Navigate to="/school-admin/dashboard" replace />
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* ============================================================
          [NEW] Route Login Admin Sekolah — tanpa tab, tanpa OAuth
          ============================================================ */}
      <Route
        path="/login/admin-sekolah"
        element={
          !session ? (
            <AdminSchoolLoginPage />
          ) : authError ? (
            <div className="grid min-h-screen place-items-center text-center p-6">
              <div>
                <h2 className="text-lg font-bold text-tp-text mb-2">Gagal memuat akun</h2>
                <p className="text-sm text-tp-muted mb-4">{authError}</p>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          ) : checkingRole || userRole === null ? (
            <div className="grid min-h-screen place-items-center font-sans text-tp-muted">
              Memverifikasi akun...
            </div>
          ) : userRole === 'school_admin' ? (
            schoolInactive ? (
              <SchoolInactivePage />
            ) : (
              <Navigate to="/school-admin/dashboard" replace />
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* --- Route Admin Sekolah (Nested) --- */}
      <Route
        path="/school-admin/dashboard"
        element={
          !session ? (
            <Navigate to="/" replace />
          ) : checkingRole || userRole === null ? (
            <div className="grid min-h-screen place-items-center font-sans text-tp-muted">
              Memverifikasi akun...
            </div>
          ) : userRole === 'school_admin' && schoolInactive ? (
            <SchoolInactivePage />
          ) : userRole !== 'school_admin' ? (
            <Navigate to="/" replace />
          ) : (
            <SchoolAdminDashboard session={session} />
          )
        }
      >
        <Route index element={<SchoolDashboardOverview />} />
        <Route path="school" element={<SchoolProfilePage />} />
        <Route path="academic-years" element={<SchoolAcademicYearPage />} />
        <Route path="classes" element={<ClassManagementPage />} />
        <Route path="students" element={<StudentManagementPage />} />

        {/* Attendance Routes */}
        <Route path="attendance" element={<AttendanceDashboard />} />
        <Route path="attendance/shifts" element={<ShiftManagementPage />} />
        <Route path="attendance/calendar" element={<CalendarManagementPage />} />
        <Route path="attendance/assignments" element={<ShiftAssignmentPage />} />
        <Route path="attendance/qr-codes" element={<QrCodeManagementPage />} />
        <Route path="attendance/sessions" element={<AttendanceSessionPage />} />
        <Route
          path="attendance/scanner/:sessionId"
          element={<AttendanceScannerPage />}
        />
        <Route path="attendance/reports" element={<AttendanceReportPage />} />
        {/* RFID & Kiosk Routes */}
        <Route path="attendance/rfid-cards" element={<RfidCardManagementPage />} />
        <Route path="attendance/devices" element={<DeviceManagementPage />} />
        {/* === EXAM ROUTES === */}
        <Route path="exams" element={<ExamListPage />} />
        <Route path="exams/create" element={<CreateExamPage />} />
        <Route path="exams/:examId" element={<ExamDetailPage />} />
        <Route path="exams/:examId/edit" element={<EditExamPage />} />

        {/* Exam Schedules Routes */}
        <Route path="exam-schedules" element={<ExamSchedulePage />} />
        <Route path="exam-schedules/create" element={<CreateExamSchedulePage />} />
        <Route path="exam-schedules/:scheduleId/monitor" element={<ExamMonitorPage />} />
        <Route path="exam-schedules/:scheduleId/grades" element={<ExamGradesPage />} />
        <Route
          path="exam-schedules/:scheduleId/submissions/:submissionId"
          element={<ExamSubmissionDetailPage />}
        />
        <Route path="exam-schedules/:scheduleId/edit" element={<CreateExamSchedulePage />} />
        <Route path="exam-schedules/:scheduleId" element={<ExamScheduleDetailPage />} />
        {/* ================== */}
      </Route>

      {/* Kiosk Route — tanpa login, auth via device code */}
      <Route path="/kiosk/:deviceCode" element={<KioskPage />} />

      {/* --- Route Register & Publik --- */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/disclaimer" element={<DisclaimerPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/school-exam" element={<TakeSchoolExamPage />} />
      <Route path="/personal-exam" element={<TakePersonalExamPage />} />

      {/* ==========================================
          Route Public Personal Exam (untuk siswa)
          Uncomment setelah R&D selesai
      ========================================== */}
      {/* <Route path="/personal-exam" element={<TakePersonalExamPage />} /> */}

      {/* --- Route User Guru --- */}
      <Route
        path="/"
        element={
          !session ? (
            // [OLD] Sebelumnya render LoginPage langsung
            // <LoginPage />

            // [NEW] Redirect ke /login/guru (default portal guru)
            <Navigate to="/login/guru" replace />
          ) : authError ? (
            <div className="grid min-h-screen place-items-center text-center p-6">
              <div>
                <h2 className="text-lg font-bold text-tp-text mb-2">Gagal memuat akun</h2>
                <p className="text-sm text-tp-muted mb-4">{authError}</p>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          ) : checkingRole || userRole === null ? (
            <div className="grid min-h-screen place-items-center font-sans text-tp-muted">
              Memverifikasi akun...
            </div>
          ) : userRole === 'school_admin' ? (
            schoolInactive ? (
              <SchoolInactivePage />
            ) : (
              <Navigate to="/school-admin/dashboard" replace />
            )
          ) : (
            <MainLayout
              session={session}
              teacherType={teacherType}
              schoolMemberships={schoolMemberships}
            />
          )
        }
      >
        <Route index element={<DashboardOverview tokenBalance={tokenBalance} />} />
        <Route path="profile" element={<ProfilePage session={session} />} />

        <Route
          path="question-bank"
          element={<QuestionBankPage onBack={() => (window.location.href = '/')} />}
        />

        <Route path="ebooks" element={<EbooksPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="exam-session" element={<ExamSessionPage session={session} />} />

        {/* ==========================================
            Personal Exam Routes (untuk guru B2C)
        ========================================== */}
        <Route path="personal-exams" element={<PersonalExamListPage />} />
        <Route path="personal-exams/create" element={<PersonalExamCreatePage />} />
        <Route path="personal-exams/:examId" element={<PersonalExamDetailPage />} />
        <Route path="personal-exams/:examId/edit" element={<PersonalExamCreatePage />} />
        <Route
          path="personal-exams/:examId/participants"
          element={<PersonalExamParticipantsPage />}
        />
        <Route
          path="personal-exams/:examId/qr-sheet"
          element={<PersonalExamQrSheetPage />}
        />

        <Route path="personal-students" element={<PersonalStudentManagementPage />} />
      </Route>

      {/* --- 404 --- */}
      <Route
        path="*"
        element={
          <div className="grid min-h-screen place-items-center bg-tp-bg text-center p-6">
            <div>
              <h1 className="text-4xl font-bold text-tp-text mb-2">404</h1>
              <p className="text-sm text-tp-muted mb-4">
                Halaman yang Anda cari tidak ditemukan.
              </p>
              <a
                href="/"
                className="inline-block rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white transition hover:bg-tp-green-hover"
              >
                Ok
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  )
}