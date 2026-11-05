import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

// Aset: sesuaikan path/nama file bila perlu
import logoBrand from '../../assets/skoolago_typograph_brand.png'
import superadminIllustration from '../../assets/computer-login-bro.png'

interface SuperAdminLoginPageProps {
  onLoginSuccess: (token: string, adminName: string) => void
}

interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
    retry_after_seconds?: number
  }
}

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-tp-border bg-white px-4 text-sm text-tp-text placeholder:text-tp-muted transition focus:border-tp-green focus:outline-none focus:ring-2 focus:ring-tp-green/20'

export default function SuperAdminLoginPage({ onLoginSuccess }: SuperAdminLoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [lockCountdown, setLockCountdown] = useState<number>(0)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Countdown untuk lockout
  useEffect(() => {
    let timer: number
    if (lockCountdown > 0) {
      timer = window.setInterval(() => {
        setLockCountdown((prev) => {
          if (prev <= 1) {
            setErrorMsg('')
            return 0
          }
          const nextVal = prev - 1
          setErrorMsg(`Akun dikunci sementara. Coba lagi dalam ${nextVal} detik.`)
          return nextVal
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [lockCountdown])

  // Ambil lokasi saat halaman dimuat
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          localStorage.setItem('superadmin_location', JSON.stringify(coords))
        },
        (error) => {
          console.warn('Izin lokasi ditolak atau tidak tersedia:', error.message)
        },
        { timeout: 10000 }
      )
    }
  }, [])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockCountdown > 0) return

    setLoading(true)
    setErrorMsg('')

    const cachedLocation = localStorage.getItem('superadmin_location')
    const locationData = cachedLocation ? JSON.parse(cachedLocation) : null

    try {
      const response = await axios.post(
        `${API_URL}/api/superadmin/superadmin-login`,
        {
          email,
          password,
          location: locationData,
        },
      )

      // response.data punya nested "data"
      const payload = response.data?.data
      const token: string | undefined = payload?.token
      const adminName: string | undefined = payload?.admin?.name

      if (!token || !adminName) {
        setErrorMsg('Respons server tidak valid.')
        return
      }

      localStorage.setItem('superadmin_token', token)
      localStorage.setItem('superadmin_name', adminName)

      // Opsional: simpan expires_in untuk refresh logic
      if (payload?.expires_in) {
        const expAt = Date.now() + payload.expires_in * 1000
        localStorage.setItem('superadmin_token_exp', String(expAt))
      }

      onLoginSuccess(token, adminName)
    } catch (err: any) {
      const status: number | undefined = err.response?.status
      const body: ApiErrorBody | undefined = err.response?.data
      const errCode = body?.error?.code
      const errMessage = body?.error?.message

      // 429 untuk lockout
      if (status === 429 && errCode === 'ACCOUNT_LOCKED') {
        // `||` (bukan `??`) agar nilai NaN dari header yang tidak ada ikut jatuh ke 60
        const retryAfter =
          body?.error?.retry_after_seconds ||
          Number(err.response?.headers?.['retry-after']) ||
          60

        setLockCountdown(retryAfter)
        setErrorMsg(
          errMessage ||
            `Terlalu banyak percobaan gagal. Akun dikunci sementara selama ${retryAfter} detik.`,
        )
      } else if (status === 401 && errCode === 'INVALID_CREDENTIALS') {
        // Pesan sudah generik dari backend ("Email atau kata sandi salah")
        setErrorMsg(errMessage || 'Email atau kata sandi salah')
      } else if (status === 400 && errCode === 'INVALID_INPUT') {
        setErrorMsg(errMessage || 'Format input tidak valid')
      } else if (errMessage) {
        // Fallback: pakai pesan dari backend kalau ada
        setErrorMsg(errMessage)
      } else {
        setErrorMsg('Gagal terhubung ke server backend.')
      }
    } finally {
      setLoading(false)
    }
  }

  const locked = lockCountdown > 0

  return (
    <div className="flex min-h-screen items-start justify-center bg-tp-bg p-3 sm:items-center sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      <div className="my-auto grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-tp-border bg-white shadow-tp-md md:min-h-[600px] md:grid-cols-[1.05fr_1fr]">
        {/* ====== PANEL KIRI: logo, ilustrasi, tagline (hanya tablet/desktop) ====== */}
        <aside className="hidden flex-col bg-gradient-to-b from-tp-green/10 via-tp-green/5 to-transparent p-10 md:flex">
          <img src={logoBrand} alt="SkoolaGo" className="h-10 w-auto self-start object-contain" />

          <div className="flex flex-1 items-center justify-center py-6">
            <img
              src={superadminIllustration}
              alt="Ilustrasi pusat kendali sistem"
              className="max-h-[280px] w-full max-w-[360px] object-contain"
            />
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold leading-snug text-tp-text">Pusat Kendali Sistem</p>
            <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-tp-muted">
              Akses khusus Role Super Admin internal pengelola sistem SkoolaGo.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-tp-muted">
            Copyright © 2025 - 2026{' '}
            <a
              href="https://skoolago.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 transition-colors hover:text-tp-green hover:underline"
            >
              SkoolaGo. All Rights Reserved.
            </a>
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
              Portal Superadmin
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-tp-text sm:text-4xl">Masuk</h1>
          <p className="mb-6 mt-2 text-xs leading-relaxed text-tp-muted sm:text-sm">
            Masukkan kredensial superadmin untuk masuk ke portal superadmin.
          </p>

          {/* ====== TAMPILAN ERROR LOGIN ====== */}
          {errorMsg && (
            <div
              // Saat countdown, pesan berubah tiap detik: jangan diumumkan ulang terus-menerus
              role={locked ? undefined : 'alert'}
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              <p className="text-xs font-medium leading-relaxed text-red-600 sm:text-sm">
                {errorMsg}
              </p>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleAdminLogin}>
            <div>
              <label htmlFor="admin-email" className="sr-only">
                Email Superadmin
              </label>
              <input
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@mail.com"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="sr-only">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi"
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
            </div>

            <button
              type="submit"
              disabled={loading || locked}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tp-green text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {locked ? (
                `Terkunci (${lockCountdown}s)`
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk sebagai Superadmin'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-tp-border pt-4 text-center">
            <a
              href="/"
              className="text-xs text-tp-muted transition-colors hover:text-tp-green"
            >
              ← Kembali ke Halaman Utama
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
