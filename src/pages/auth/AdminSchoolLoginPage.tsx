import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import CrispChat from '../../components/CrispChat'

// Aset: sesuaikan path/nama file bila perlu
import logoBrand from '../../assets/skoolago_typograph_brand.png'
import adminIllustration from '../../assets/computer-login-bro.png'

// TODO: sesuaikan dengan route "lupa password" yang dipakai di aplikasi Anda
const FORGOT_PASSWORD_PATH = '/forgot-password'

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-tp-border bg-white px-4 text-sm text-tp-text placeholder:text-tp-muted transition focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20'

export default function AdminSchoolLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return
    setLoading(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      // Redirect ditangani oleh App.tsx via onAuthStateChange + check-role
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

  return (
    <div className="flex min-h-screen items-start justify-center bg-tp-bg p-3 sm:items-center sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      <CrispChat />

      <div className="my-auto grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-tp-border bg-white shadow-tp-md md:min-h-[620px] md:grid-cols-[1.05fr_1fr]">
        {/* ====== PANEL KIRI: logo, ilustrasi, tagline (hanya tablet/desktop) ====== */}
        <aside className="hidden flex-col bg-gradient-to-b from-tp-green/10 via-tp-green/5 to-transparent p-10 md:flex">
          <img src={logoBrand} alt="SkoolaGo" className="h-10 w-auto self-start object-contain" />

          <div className="flex flex-1 items-center justify-center py-6">
            <img
              src={adminIllustration}
              alt="Ilustrasi admin sekolah mengelola data"
              className="max-h-[300px] w-full max-w-[380px] object-contain"
            />
          </div>

          <p className="text-center text-lg font-semibold leading-snug text-tp-text">
            Kelola data sekolah jadi
            <br />
            lebih mudah dan terpusat
          </p>
        </aside>

        {/* ====== PANEL KANAN: form login ====== */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-12 sm:py-12">
          {/* Logo versi mobile (panel kiri disembunyikan) */}
          <img
            src={logoBrand}
            alt="SkoolaGo"
            className="mb-6 h-9 w-auto self-start object-contain md:hidden"
          />

          <div className="mb-4 inline-flex items-center self-start rounded-full bg-tp-green/10 px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-tp-green sm:text-xs">
              Portal Pendidikan Sekolah
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-tp-text sm:text-4xl">Masuk</h1>
          <p className="mb-6 mt-2 text-xs text-tp-muted sm:text-sm">
            Gunakan email admin yang diberikan oleh administrator sistem.
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

          <form onSubmit={handleEmailLogin} className="space-y-3.5" noValidate={false}>
            <div>
              <label htmlFor="admin-email" className="sr-only">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (loginError) setLoginError(null)
                }}
                placeholder="nama@sekolah.sch.id"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (loginError) setLoginError(null)
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

            {/* T&C checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms-checkbox-admin"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-tp-border text-tp-green focus:ring-tp-green"
              />
              <label
                htmlFor="terms-checkbox-admin"
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
                , dan{' '}
                <Link
                  to="/privacy"
                  rel="noopener noreferrer"
                  className="font-medium text-tp-green hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Kebijakan Privasi
                </Link>{' '}
                SkoolaGo
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
                'Masuk ke Portal Admin'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-tp-border pt-4">
            <p className="text-center text-[11px] leading-relaxed text-tp-muted sm:text-xs">
              Tidak punya akses? Hubungi administrator sistem.
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/login/guru"
              className="text-xs text-tp-muted transition-colors hover:text-tp-green"
            >
              ← Kembali ke Portal Guru
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
