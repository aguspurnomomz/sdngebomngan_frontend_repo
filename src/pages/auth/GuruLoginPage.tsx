import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import LoginBanner from './components/LoginBanner'
import LoginTabs from './components/LoginTabs'
import EmailPasswordForm from './components/EmailPasswordForm'
import GoogleOAuthButton from './components/GoogleOAuthButton'

type GuruTab = 'individual' | 'sekolah'

export default function GuruLoginPage() {
  const [activeTab, setActiveTab] = useState<GuruTab>('individual')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return // safety guard, walau tombol sudah disabled
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      // Redirect ditangani oleh App.tsx via onAuthStateChange + check-role
    } catch (err: any) {
      alert('Gagal login: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!agreed) return

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
      alert('Gagal login dengan Google: ' + error.message)
    }
  }

  const tabs = [
    { id: 'individual', label: 'Guru Individual' },
    { id: 'sekolah', label: 'Guru Sekolah' },
  ]

  const emailPlaceholder =
    activeTab === 'individual' ? 'nama@gmail.com' : 'nama@sekolah.sch.id'

  return (
    <div className="flex min-h-screen items-start justify-center bg-tp-bg p-3 sm:items-center sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      <div className="grid w-full max-w-[920px] my-auto overflow-hidden rounded-3xl border border-tp-border bg-white shadow-tp-md md:grid-cols-2">
        <LoginBanner />

        <div className="flex flex-col justify-center px-5 py-6 sm:px-11 sm:py-12">
          <h2 className="mb-1 text-xl font-bold tracking-tight text-tp-text sm:text-2xl">
            Selamat datang di Portal Guru
          </h2>
          <p className="mb-5 text-xs text-tp-muted sm:text-sm">
            Pilih jenis akun Anda untuk melanjutkan.
          </p>

          <LoginTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as GuruTab)}
          />

          {activeTab === 'individual' && (
            <p className="mb-3 text-[11px] sm:text-xs text-tp-muted leading-relaxed">
              Untuk guru yang mengajar mandiri. Gunakan email pribadi atau akun Google.
            </p>
          )}
          {activeTab === 'sekolah' && (
            <p className="mb-3 text-[11px] sm:text-xs text-tp-muted leading-relaxed">
              Untuk guru yang terdaftar di sekolah. Gunakan email yang didaftarkan admin
              sekolah.
            </p>
          )}

          {/* Form email + password — PRIMARY action */}
          <EmailPasswordForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleEmailLogin}
            loading={loading}
            emailPlaceholder={emailPlaceholder}
            showForgotPassword
            submitDisabled={!agreed}
          />

          {/* T&C checkbox — DI ATAS kedua tombol (Masuk & Google) */}
          <div className="mt-4 flex items-start gap-2">
            <input
              type="checkbox"
              id="terms-checkbox-guru"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-tp-border text-tp-green focus:ring-tp-green cursor-pointer"
            />
            <label
              htmlFor="terms-checkbox-guru"
              className="text-[11px] sm:text-xs text-tp-muted leading-relaxed select-none cursor-pointer"
            >
              Saya telah membaca dan menyetujui{' '}
              <Link
                to="/terms"
                rel="noopener noreferrer"
                className="font-medium text-tp-green hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Syarat & Ketentuan
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

          {/* Divider "Atau lanjutkan dengan" */}
          <div className="my-4 flex items-center gap-3 text-xs text-tp-faint before:h-px before:flex-1 before:bg-tp-border after:h-px after:flex-1 after:bg-tp-border">
            Atau lanjutkan dengan
          </div>

          {/* Google OAuth — SECONDARY action */}
          <GoogleOAuthButton
            disabled={!agreed}
            onClick={handleGoogleLogin}
            label="Masuk dengan Google"
          />

          {/* Link daftar — hanya tampil di tab Individual */}
          {activeTab === 'individual' && (
            <p className="mt-5 text-center text-xs sm:text-[13px] text-tp-muted">
              Belum punya akun?{' '}
              <Link
                to="/register"
                className="font-semibold text-tp-green hover:underline"
              >
                Daftar di sini
              </Link>
            </p>
          )}

          {activeTab === 'sekolah' && (
            <p className="mt-5 text-center text-xs sm:text-[13px] text-tp-muted">
              Belum terdaftar di sekolah?{' '}
              <span className="font-medium text-tp-text">
                Hubungi admin sekolah Anda.
              </span>
            </p>
          )}

          {/* Link ke admin sekolah */}
          <div className="mt-4 pt-4 border-t border-tp-border text-center">
            <Link
              to="/login/admin-sekolah"
              className="text-xs text-tp-muted hover:text-tp-green transition-colors"
            >
              Login sebagai Admin Sekolah →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}