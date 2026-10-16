import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      alert('Gagal mengirim email: ' + error.message)
    } else {
      setMessage('Tautan pemulihan kata sandi telah dikirim ke email anda. Silakan cek kotak masuk dan folder spam pada email anda.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tp-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-tp-border bg-white p-6 shadow-tp-md">
        <h2 className="mb-2 text-2xl font-bold text-tp-text">Lupa Kata Sandi</h2>
        <p className="mb-5 text-xs text-tp-muted">Masukkan email akun anda untuk menerima informasi tautan lupa kata sandi anda.</p>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
          <div className="grid gap-1">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              placeholder="nama@sekolah.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-tp-green text-white">
            {loading ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs">
          <Link to="/" className="text-tp-green hover:underline font-semibold">Kembali</Link>
        </div>
      </div>
    </div>
  )
}