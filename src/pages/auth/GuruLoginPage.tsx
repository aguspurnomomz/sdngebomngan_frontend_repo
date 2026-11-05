import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import CrispChat from '../../components/CrispChat'

import logoBrand from '../../assets/skoolago_typograph_brand.png'
import guruIllustration from '../../assets/computer-login-bro.png'

const FORGOT_PASSWORD_PATH = '/forgot-password'

type GuruTab = 'individual' | 'sekolah'

const TABS: { id: GuruTab; label: string }[] = [
  { id: 'individual', label: 'Guru Individual' },
  { id: 'sekolah', label: 'Guru Sekolah' },
]

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-tp-border bg-white px-4 text-sm text-tp-text placeholder:text-tp-muted transition focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.63H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.37l4.01-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.63l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
)

export default function GuruLoginPage() {
  const [activeTab, setActiveTab] = useState<GuruTab>('individual')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const clearError = () => {
    if (loginError) setLoginError(null)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return // safety guard, walau tombol sudah disabled
    setLoading(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      // Redirect ditangani oleh App.tsx via onAuthStateChange dan check-role
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setLoginError('Email atau password salah. Silakan coba lagi.')
      } else {
        setLoginError(err.message || 'Terjadi kesalahan')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!agreed) return
    setLoginError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      setLoginError('Gagal login dengan Google: ' + error.message)
    }
  }

  const emailPlaceholder = activeTab === 'individual' ? 'nama@gmail.com' : 'nama@sekolah.sch.id'

  return (
    <div className="flex min-h-screen items-start justify-center bg-tp-bg p-3 sm:items-center sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      <CrispChat />

      <div className="my-auto grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-tp-border bg-white shadow-tp-md md:min-h-[660px] md:grid-cols-[1.05fr_1fr]">
        {/* ====== PANEL KIRI logo, ilustrasi, tagline (hanya tablet/desktop) ====== */}
        <aside className="hidden flex-col bg-gradient-to-b from-tp-green/10 via-tp-green/5 to-transparent p-10 md:flex">
          <img src={logoBrand} alt="SkoolaGo" className="h-10 w-auto self-start object-contain" />

          <div className="flex flex-1 items-center justify-center py-6">
            <img
              src={guruIllustration}
              alt="Ilustrasi guru sedang mengajar"
              className="max-h-[300px] w-full max-w-[380px] object-contain"
            />
          </div>

          <p className="text-center text-lg font-semibold leading-snug text-tp-text">
            Guru lebih fokus mengajar,
            <br />
            administrasi jadi lebih ringan
          </p>
        </aside>

        {/* ====== PANEL KANAN form login ====== */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-12 sm:py-10">
          {/* Logo versi mobile (panel kiri disembunyikan) */}
          <img
            src={logoBrand}
            alt="SkoolaGo"
            className="mb-6 h-9 w-auto self-start object-contain md:hidden"
          />

          <h1 className="text-3xl font-bold tracking-tight text-tp-text sm:text-4xl">Masuk</h1>
          <p className="mb-5 mt-2 text-xs text-tp-muted sm:text-sm">
            Selamat datang di Portal Guru. Pilih jenis akun Anda untuk melanjutkan.
          </p>

          {/* Tab jenis akun */}
          <div
            role="tablist"
            aria-label="Jenis akun guru"
            className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-tp-green/10 p-1"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(tab.id)
                    clearError()
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green/40 sm:text-sm ${
                    active
                      ? 'bg-white text-tp-green shadow-sm'
                      : 'text-tp-muted hover:text-tp-text'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <p role="tabpanel" className="mb-4 text-[11px] leading-relaxed text-tp-muted sm:text-xs">
            {activeTab === 'individual'
              ? 'Untuk guru yang mengajar mandiri. Gunakan email pribadi atau akun Google.'
              : 'Untuk guru yang terdaftar di sekolah. Gunakan email yang didaftarkan admin sekolah.'}
          </p>

          {/* ====== TAMPILAN ERROR LOGIN ====== */}
          {loginError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-red-600 sm:text-sm">{loginError}</p>
            </div>
          )}

          {/* Form email + password — PRIMARY action */}
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label htmlFor="guru-email" className="sr-only">
                Email
              </label>
              <input
                id="guru-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError()
                }}
                placeholder={emailPlaceholder}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="guru-password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="guru-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError()
                  }}
                  placeholder="Password"
                  className={`${INPUT_CLASS} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-tp-muted transition hover:text-tp-green focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green/40"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="mt-2 flex justify-end">
                <Link
                  to={FORGOT_PASSWORD_PATH}
                  className="text-xs font-medium text-tp-green hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
            </div>

            {/* T&C checkbox — DI ATAS kedua tombol (Masuk & Google) */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms-checkbox-guru"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-tp-border text-tp-green focus:ring-tp-green"
              />
              <label
                htmlFor="terms-checkbox-guru"
                className="cursor-pointer select-none text-[11px] leading-relaxed text-tp-muted sm:text-xs"
              >
                Saya telah membaca dan menyetujui{' '}
                <Link
                  to="/terms"
                  rel="noopener noreferrer"
                  className="font-medium text-tp-green hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Syarat &amp; Ketentuan
                </Link>
                ,{' '}
                <Link
                  to="/privacy"
                  rel="noopener noreferrer"
                  className="font-medium text-tp-green hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Kebijakan Privasi
                </Link>
                , dan{' '}
                <Link
                  to="/disclaimer"
                  rel="noopener noreferrer"
                  className="font-medium text-tp-green hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Disclaimer
                </Link>{' '}
                TeachPartner.
              </label>
            </div>

            <button
              type="submit"
              disabled={!agreed || loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tp-green text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3 text-xs text-tp-faint before:h-px before:flex-1 before:bg-tp-border after:h-px after:flex-1 after:bg-tp-border">
            atau
          </div>

          {/* Google OAuth — SECONDARY action */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!agreed}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-tp-border bg-white text-sm font-medium text-tp-text transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleIcon />
            Masuk dengan Google
          </button>

          {/* Link daftar / info — sesuai tab */}
          {/* {activeTab === 'individual' && (
            <p className="mt-5 text-center text-xs text-tp-muted sm:text-[13px]">
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold text-tp-green hover:underline">
                Daftar di sini
              </Link>
            </p>
          )} */}

          {activeTab === 'sekolah' && (
            <p className="mt-5 text-center text-xs text-tp-muted sm:text-[13px]">
              Belum terdaftar di sekolah?{' '}
              <span className="font-medium text-tp-text">Hubungi admin sekolah Anda.</span>
            </p>
          )}

          {/* Link ke admin sekolah */}
          <div className="mt-4 border-t border-tp-border pt-4 text-center">
            <Link
              to="/login/admin-sekolah"
              className="text-xs text-tp-muted transition-colors hover:text-tp-green"
            >
              Login sebagai Admin Sekolah →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
