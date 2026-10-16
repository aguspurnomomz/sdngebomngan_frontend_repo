import React, { useState } from 'react'
import axios from 'axios'
import * as Sentry from '@sentry/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { KeyRound, Eye, EyeOff, Laptop, Server, Activity, RefreshCw, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

interface LogItem {
  id: number
  email: string
  action: string
  ip_address: string
  user_agent: string
  location?: string
  details: string
  created_at: string
}

interface SuperAdminSecurityProps {
  logs: LogItem[]
  onRefreshLogs: () => void
}

const MIN_PASSWORD_LENGTH = 12

export default function SuperAdminSecurity({ logs, onRefreshLogs }: SuperAdminSecurityProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [changingPass, setChangingPass] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  const handleTestSentryFrontend = () => {
    try {
      throw new Error('Test Error dari Frontend React Superadmin!')
    } catch (err) {
      Sentry.captureException(err)
      alert('Berhasil! Error tes Frontend telah dikirim ke Sentry.')
    }
  }

  const handleTestSentryBackend = async () => {
    try {
      await axios.get(`${API_URL}/debug-sentry`)
    } catch (err: any) {
      alert('Berhasil! Endpoint tes Backend berhasil dipicu (Status 500). Cek dashboard Sentry Anda.')
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter`)
      return
    }

    if (newPassword === oldPassword) {
      setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi lama')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok!')
      return
    }

    setShowConfirmModal(true)
  }

  const executeChangePassword = async () => {
  setChangingPass(true)
  setErrorMsg('')
  setSuccessMsg('')

  try {
    const token = localStorage.getItem('superadmin_token')
    const cachedLocation = localStorage.getItem('superadmin_location')
    const locationData = cachedLocation ? JSON.parse(cachedLocation) : null

    const response = await axios.post(
      `${API_URL}/api/superadmin/change-password`,
      {
        old_password: oldPassword,
        new_password: newPassword,
        location: locationData,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    setShowConfirmModal(false)

    if (response.data?.session_ended) {
      setSuccessMsg('Kata sandi berhasil diubah! Anda akan dialihkan ke halaman login...')
      localStorage.removeItem('superadmin_token')
      localStorage.removeItem('superadmin_name')
      localStorage.removeItem('superadmin_token_exp')

      setTimeout(() => {
        window.location.href = '/superadmin/login'
      }, 2000)
      return
    }


    setSuccessMsg('Kata sandi berhasil diubah!')
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onRefreshLogs()

  } catch (err: any) {
    setShowConfirmModal(false)

    const errCode = err.response?.data?.error?.code
    const errMsg = err.response?.data?.error?.message

    if (errCode === 'INVALID_OLD_PASSWORD') {
      setErrorMsg('Kata sandi lama yang Anda masukkan salah')
    } else if (errCode === 'PASSWORD_TOO_SHORT') {
      setErrorMsg(`Kata sandi baru minimal 12 karakter`)
    } else if (errCode === 'PASSWORD_UNCHANGED') {
      setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi lama')
    } else if (errMsg) {
      setErrorMsg(errMsg)
    } else {
      setErrorMsg(err.message || 'Gagal mengubah kata sandi')
    }
  } finally {
    setChangingPass(false)
  }
}

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentLogs = logs.slice(startIndex, startIndex + itemsPerPage)

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text sm:text-[28px]">Keamanan & Log Aktivitas</h1>
        <p className="text-sm text-tp-muted">Perbarui kata sandi, uji monitoring error, dan pantau riwayat jejak keamanan administrator sistem.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Form Ganti Sandi */}
        <Card className="rounded-2xl border-tp-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-tp-text flex items-center gap-2">
              <KeyRound size={18} className="text-tp-green" /> Ubah Kata Sandi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Kata Sandi Lama</Label>
                <div className="relative flex items-center">
                  <Input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="pr-10"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowOldPass(!showOldPass)}
                    tabIndex={-1}
                  >
                    {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid gap-1.5">
                {/* ===== PERUBAHAN: label jadi min 12 ===== */}
                <Label className="text-xs">Kata Sandi Baru (Min. {MIN_PASSWORD_LENGTH} Karakter)</Label>
                <div className="relative flex items-center">
                  <Input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    placeholder="••••••••"
                    className="pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowNewPass(!showNewPass)}
                    tabIndex={-1}
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Konfirmasi Kata Sandi Baru</Label>
                <div className="relative flex items-center">
                  <Input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    tabIndex={-1}
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={changingPass}
                  className="rounded-xl bg-tp-green hover:bg-tp-green-hover text-white text-sm font-semibold"
                >
                  Perbarui Kata Sandi
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 2. CARD PENGUJIAN SENTRY */}
        <Card className="rounded-2xl border-tp-border bg-white shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold text-tp-text flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
              Pengujian Sentry Monitoring
            </CardTitle>
            <CardDescription className="text-xs">
              Pastikan integrasi pemantau kesalahan (Sentry) berjalan baik pada lingkungan Client maupun Server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestSentryFrontend}
              className="w-full flex items-center justify-between rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 h-12 px-4"
            >
              <span className="flex items-center gap-2"><Laptop size={16} /> Trigger Error Frontend (React)</span>
              <span className="rounded-md bg-indigo-200/60 px-2 py-0.5 text-[10px] font-bold">Client</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestSentryBackend}
              className="w-full flex items-center justify-between rounded-xl border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100 h-12 px-4"
            >
              <span className="flex items-center gap-2"><Server size={16} /> Trigger Panic Backend (Golang)</span>
              <span className="rounded-md bg-rose-200/60 px-2 py-0.5 text-[10px] font-bold">Server</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Riwayat Log Aktivitas dengan Pagination */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-tp-text flex items-center gap-2">
            <Activity size={18} className="text-tp-green" /> Riwayat Log Keamanan (Audit Trail)
          </h3>
          <Button
            type="button"
            variant="outline"
            onClick={onRefreshLogs}
            className="rounded-xl border-tp-border bg-white gap-1.5 text-xs h-8"
          >
            <RefreshCw size={14} /> Muat Ulang Log
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-tp-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-tp-border bg-gray-50 text-xs font-semibold uppercase tracking-wider text-tp-muted">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5">Aksi / Aktivitas</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Lokasi (Koordinat)</th>
                  <th className="px-5 py-3.5">Detail / Perangkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-tp-muted text-xs">
                      Belum ada catatan log aktivitas keamanan.
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 text-xs text-tp-muted whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          log.action === 'LOGIN_SUCCESS'
                            ? 'bg-emerald-100 text-emerald-700'
                            : log.action === 'CHANGE_PASSWORD'
                            ? 'bg-blue-100 text-blue-700'
                            : log.action === 'CHANGE_PASSWORD_FAILED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-tp-muted">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-tp-muted whitespace-nowrap">
                        {log.location ? (
                          <a
                            href={`https://maps.google.com/?q=${log.location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-tp-green hover:underline font-mono"
                          >
                            <MapPin size={12} /> {log.location}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-tp-text max-w-xs truncate" title={log.user_agent}>
                        {log.user_agent || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Kontrol Navigasi Pagination */}
          {logs.length > 0 && (
            <div className="flex items-center justify-between border-t border-tp-border bg-gray-50/50 px-5 py-3 text-xs text-tp-muted">
              <div>
                Menampilkan <span className="font-semibold text-tp-text">{startIndex + 1}</span> -{' '}
                <span className="font-semibold text-tp-text">{Math.min(startIndex + itemsPerPage, logs.length)}</span> dari{' '}
                <span className="font-semibold text-tp-text">{logs.length}</span> log
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8 rounded-lg gap-1 bg-white text-xs"
                >
                  <ChevronLeft size={14} /> Sebelumnya
                </Button>
                <span className="font-medium text-tp-text px-1">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-lg gap-1 bg-white text-xs"
                >
                  Selanjutnya <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL (Ganti Password) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Icon Peringatan */}
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

            <h3 className="mb-2 text-center text-xl font-bold text-gray-950">
              Perhatian!
            </h3>
            <p className="mb-6 text-center text-sm text-gray-600">
              Apakah Anda yakin ingin memperbarui kata sandi akun Superadmin ini?
              <br />
              <span className="text-xs text-gray-400">
                Pastikan Anda mengingat kata sandi baru yang dimasukkan.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={changingPass}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeChangePassword}
                disabled={changingPass}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPass ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  'Ya, Perbarui'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}