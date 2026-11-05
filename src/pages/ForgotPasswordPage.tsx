import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

import logoBrand from '../assets/skoolago_typograph_brand.png'
import forgotIllustration from '../assets/binary-code-bro.png'

const BACK_PATH = '/pilih-portal'

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-tp-border bg-white px-4 text-sm text-tp-text placeholder:text-tp-muted transition focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw new Error(error.message)
      setSent(true)
    } catch (err: any) {
      setError('Gagal mengirim email: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setLoading(false)
    }
  }

  const backLink = (
    <Link
      to={BACK_PATH}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-tp-muted transition-colors hover:text-tp-green"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      Kembali ke portal login
    </Link>
  )

  return (
    <div className="flex min-h-screen items-start justify-center bg-tp-bg p-3 sm:items-center sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      <div className="my-auto grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-tp-border bg-white shadow-tp-md md:min-h-[540px] md:grid-cols-[1.05fr_1fr]">
        {/* ====== PANEL KIRI: logo, ilustrasi, tagline (hanya tablet/desktop) ====== */}
        <aside className="hidden flex-col bg-gradient-to-b from-tp-green/10 via-tp-green/5 to-transparent p-10 md:flex">
          <img src={logoBrand} alt="SkoolaGo" className="h-10 w-auto self-start object-contain" />

          <div className="flex flex-1 items-center justify-center py-6">
            <img
              src={forgotIllustration}
              alt="Ilustrasi pemulihan akun"
              className="max-h-[280px] w-full max-w-[360px] object-contain"
            />
          </div>

          <p className="text-center text-lg font-semibold leading-snug text-tp-text">
            Lupa kata sandi?
            <br />
            kami bantu pulihkan akun Anda
          </p>
        </aside>

        {/* ====== PANEL KANAN ====== */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-12 sm:py-12">
          {/* Logo versi mobile (panel kiri disembunyikan) */}
          <img
            src={logoBrand}
            alt="SkoolaGo"
            className="mb-6 h-9 w-auto self-start object-contain md:hidden"
          />

          {sent ? (
            /* ====== STATE: TAUTAN SUDAH DIKIRIM ====== */
            <div role="status">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tp-green/10 text-tp-green">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </span>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-tp-text sm:text-4xl">
                Cek email Anda
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-tp-muted">
                Tautan pemulihan kata sandi telah dikirim ke{' '}
                <span className="font-semibold text-tp-text">{email}</span>. Silakan cek kotak masuk
                dan folder spam pada email Anda.
              </p>

              <Link
                to={BACK_PATH}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-tp-green text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green focus-visible:ring-offset-2"
              >
                Kembali ke halaman masuk
              </Link>

              <p className="mt-5 text-center text-xs text-tp-muted">
                Tidak menerima email?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSent(false)
                    setError(null)
                  }}
                  className="font-semibold text-tp-green hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green/40"
                >
                  Kirim ulang
                </button>
              </p>
            </div>
          ) : (
            /* ====== STATE: FORM ====== */
            <>
              <h1 className="text-3xl font-bold tracking-tight text-tp-text sm:text-4xl">
                Lupa kata sandi?
              </h1>
              <p className="mb-6 mt-2 text-xs leading-relaxed text-tp-muted sm:text-sm">
                Masukkan email akun Anda untuk menerima tautan pemulihan kata sandi.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-red-600 sm:text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleResetRequest} className="space-y-3.5">
                <div>
                  <label htmlFor="forgot-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="nama@sekolah.id"
                    className={INPUT_CLASS}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tp-green text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Tautan Pemulihan'
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-tp-border pt-4 text-center">{backLink}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
