import React, { useState } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

import logoBrand from '../assets/logo_gembongan.png'
import updateIllustration from '../assets/rest-password-bro.png'

const AFTER_UPDATE_PATH = '/'

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-tp-border bg-white px-4 text-sm text-tp-text placeholder:text-tp-muted transition focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20'

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [notified, setNotified] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL

  const passwordsMatch = newPassword === confirmPassword
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch
  const canSubmit = newPassword.length >= 6 && confirmPassword.length > 0 && passwordsMatch

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return 
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError('Gagal memperbarui password: ' + updateError.message)
      setLoading(false)
      return
    }

    let emailSent = false
    try {
      let token = (data as any)?.session?.access_token

      if (!token) {
        const sessionRes = await supabase.auth.getSession()
        token =
          sessionRes.data.session?.access_token ||
          localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          ''
      }

      if (token) {
        await axios.post(
          `${API_URL}/api/auth/notify-password-changed`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        emailSent = true
      }
    } catch (err) {
      console.error('Gagal mengirim trigger email notifikasi:', err)
    }

    setNotified(emailSent)
    await supabase.auth.signOut()
    setDone(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-tp-bg p-3 sm:items-center sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      <div className="my-auto grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-tp-border bg-white shadow-tp-md md:min-h-[540px] md:grid-cols-[1.05fr_1fr]">
        {/* ====== PANEL KIRI logo, ilustrasi, tagline (hanya tablet/desktop) ====== */}
        <aside className="hidden flex-col bg-gradient-to-b from-tp-green/10 via-tp-green/5 to-transparent p-10 md:flex">
          <img src={logoBrand} alt="SkoolaGo" className="h-10 w-auto self-start object-contain" />

          <div className="flex flex-1 items-center justify-center py-6">
            <img
              src={updateIllustration}
              alt="Ilustrasi membuat password baru"
              className="max-h-[280px] w-full max-w-[360px] object-contain"
            />
          </div>

          <p className="text-center text-lg font-semibold leading-snug text-tp-text">
            Satu langkah lagi,
            <br />
            buat kata sandi baru untuk akun Anda
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

          {done ? (
            <div role="status">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tp-green/10 text-tp-green">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </span>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-tp-text sm:text-4xl">
                Kata sandi diperbarui
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-tp-muted">
                Kata sandi Anda berhasil diperbarui.
                {notified ? ' Email pemberitahuan telah dikirim.' : ''} Silakan masuk kembali
                dengan kata sandi terbaru.
              </p>

              {/* <a> biasa agar halaman dimuat ulang penuh, seperti sebelumnya */}
              <a
                href={AFTER_UPDATE_PATH}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-tp-green text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green focus-visible:ring-offset-2"
              >
                Masuk sekarang
              </a>
            </div>
          ) : (
            /* ====== STATE: FORM ====== */
            <>
              <h1 className="text-3xl font-bold tracking-tight text-tp-text sm:text-4xl">
                Kata sandi baru
              </h1>
              <p className="mb-6 mt-2 text-xs leading-relaxed text-tp-muted sm:text-sm">
                Masukkan kata sandi baru untuk akun Anda.
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

              <form onSubmit={handleUpdate} className="space-y-3.5">
                <div>
                  <label htmlFor="new-password" className="sr-only">
                    Kata sandi baru
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (error) setError(null)
                      }}
                      placeholder="Kata sandi baru"
                      aria-describedby="new-password-hint"
                      className={`${INPUT_CLASS} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
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
                  <p id="new-password-hint" className="mt-2 text-xs text-tp-muted">
                    Minimal 6 karakter.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="sr-only">
                    Konfirmasi kata sandi baru
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (error) setError(null)
                      }}
                      placeholder="Konfirmasi kata sandi baru"
                      aria-invalid={showMismatch}
                      aria-describedby="confirm-password-hint"
                      className={`${INPUT_CLASS} pr-12 ${
                        showMismatch
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={
                        showConfirm
                          ? 'Sembunyikan konfirmasi kata sandi'
                          : 'Tampilkan konfirmasi kata sandi'
                      }
                      aria-pressed={showConfirm}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-tp-muted transition hover:text-tp-green focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green/40"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p
                    id="confirm-password-hint"
                    aria-live="polite"
                    className="mt-2 min-h-[1rem] text-xs text-red-600"
                  >
                    {showMismatch ? 'Kata sandi tidak sama.' : ''}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tp-green text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan kata sandi baru'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
