import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import LoginBanner from './components/LoginBanner'
import EmailPasswordForm from './components/EmailPasswordForm'

import CrispChat from '../../components/CrispChat' 

export default function AdminSchoolLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return 
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

  return (
    <div className="flex min-h-screen items-start justify-center bg-tp-bg p-3 sm:items-center sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      
      <CrispChat />

      <div className="grid w-full max-w-[920px] my-auto overflow-hidden rounded-3xl border border-tp-border bg-white shadow-tp-md md:grid-cols-2">
        <LoginBanner />

        <div className="flex flex-col justify-center px-5 py-6 sm:px-11 sm:py-12">
          <div className="mb-5 inline-flex items-center gap-2 self-start rounded-full bg-tp-green/10 px-3 py-1">
            {/* <span className="h-1.5 w-1.5 rounded-full bg-tp-green" /> */}
            <span className="text-[10px] sm:text-xs font-semibold text-tp-green uppercase tracking-wide">
              Portal Admin Sekolah
            </span>
          </div>

          <h2 className="mb-1 text-xl font-bold tracking-tight text-tp-text sm:text-2xl">
            Masuk ke akun Anda
          </h2>
          <p className="mb-5 text-xs text-tp-muted sm:text-sm">
            Gunakan email admin yang diberikan oleh administrator sistem.
          </p>

          <EmailPasswordForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleEmailLogin}
            submitDisabled={!agreed}
            loading={loading}
            emailPlaceholder="nama@sekolah.sch.id"
            submitLabel="Masuk ke Portal Admin"
            loadingLabel="Memproses..."
            showForgotPassword
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
              , dan{' '}
              <Link
                to="/privacy"
                rel="noopener noreferrer"
                className="font-medium text-tp-green hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Kebijakan Privasi
              </Link>
              {' '}
              SkoolaGo
              {/* , dan{' '}
              <Link
                to="/disclaimer"
                rel="noopener noreferrer"
                className="font-medium text-tp-green hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Disclaimer
              </Link>{' '}
              TeachPartner. */}
            </label>
          </div>

          <div className="mt-5 pt-4 border-t border-tp-border">
            <p className="text-[11px] sm:text-xs text-tp-muted text-center leading-relaxed">
              Tidak punya akses? Hubungi administrator sistem.
            </p>
          </div>

          <div className="mt-4 text-center">
            <a
              href="https://sdngembongan.id/"
              className="text-xs text-tp-muted hover:text-tp-green transition-colors"
            >
              ← Kembali ke Halaman Utama
            </a>
          </div>

          {/** matikan dulu ini */}
          {/* <div className="mt-4 text-center">
            <Link
              to="/login/guru"
              className="text-xs text-tp-muted hover:text-tp-green transition-colors"
            >
              ← Kembali ke Portal Guru
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  )
}