import React, { useState } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabaseClient'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      alert('Gagal memperbarui kata sandi: ' + error.message)
      setLoading(false)
      return
    }

    try {
      let token = (data as any)?.session?.access_token
      
      if (!token) {
        const sessionRes = await supabase.auth.getSession()
        token = sessionRes.data.session?.access_token || localStorage.getItem('token') || localStorage.getItem('access_token') || ''
      }

      if (token) {
        await axios.post(
          `${API_URL}/api/auth/notify-password-changed`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      }
    } catch (err) {
      console.error('Gagal mengirim trigger email notifikasi:', err)
    }

    alert('Kata sandi berhasil diperbarui! Email pemberitahuan telah dikirim. Silakan login kembali.')
    await supabase.auth.signOut()
    window.location.href = '/'
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tp-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-tp-border bg-white p-6 shadow-tp-md">
        <h2 className="mb-2 text-2xl font-bold text-tp-text">Buat Kata Sandi Baru</h2>
        <p className="mb-5 text-xs text-tp-muted">Masukkan kata sandi baru untuk akun Anda.</p>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div className="grid gap-1">
            <Label className="text-xs">Password Baru (Min. 6 karakter)</Label>
            <Input
              type="password"
              placeholder="••••••••"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-tp-green text-white">
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </Button>
        </form>
      </div>
    </div>
  )
}