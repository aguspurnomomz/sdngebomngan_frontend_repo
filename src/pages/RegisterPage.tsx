import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import teachpartnerIcon from '../assets/logo-new-version.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false) 
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password 
    })

    if (error) {
      alert('Gagal mendaftar: ' + error.message)
    } else {
      alert('Pendaftaran berhasil! Silakan masuk menggunakan akun baru Anda.')
      navigate('/') 
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tp-bg p-4 sm:p-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      <div className="grid w-full max-w-[920px] overflow-hidden rounded-3xl border border-tp-border bg-white shadow-tp-md md:grid-cols-2">
        
        {/* Kolom Kiri: Branding */}
        <div className="relative flex min-h-[auto] flex-col justify-between gap-7 overflow-hidden bg-gradient-to-br from-tp-green via-[#1a6b4a] to-[#0d3d2c] p-7 text-white md:min-h-[520px] md:gap-0 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(125,211,167,0.35),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(255,255,255,0.08),transparent_35%)]" />

          <div className="relative z-10 flex items-center gap-2.5 text-lg font-bold">
            <img 
              src={teachpartnerIcon} 
              alt="TeachPartner" 
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="relative z-10 py-0 md:py-6">
            <h2 className="mb-3 text-[22px] font-bold leading-snug tracking-tight md:text-[28px]">
              Mulai kelola administrasi mengajar Anda
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-white/80">
              Daftarkan akun Anda sekarang dan mulai gunakan fitur unggulan kami.
            </p>
          </div>

           <div className="relative z-10 text-[11px] text-white/55 sm:text-xs">
            Copyright © 2025 - 2026 {' '}
            <a 
              href="https://skoolago.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200 underline-offset-2 hover:underline"
            >
              SkoolaGo. All Rights Reserved.
            </a>
          </div>
        </div>

        {/* Kolom Kanan: Form Pendaftaran */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-11 sm:py-12">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-tp-text">Buat Akun Baru</h2>
          <p className="mb-7 text-sm text-tp-muted">Daftar menggunakan email Anda.</p>

          <form className="flex flex-col gap-4" onSubmit={handleRegister}>
            <div className="grid gap-1.5">
              <Label htmlFor="register-email" className="text-[13px] font-semibold text-gray-700">
                Email
              </Label>
              <Input
                id="register-email"
                className="h-11 rounded-xl bg-white text-sm text-tp-text"
                type="email"
                placeholder="nama@sekolah.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="register-password" className="text-[13px] font-semibold text-gray-700">
                Kata Sandi
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="register-password"
                  className="h-11 rounded-xl bg-white pr-10 text-sm text-tp-text"
                  type={showPassword ? 'text' : 'kata sandi'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!agreed || loading}
              className="mt-1 h-11 w-full rounded-xl bg-tp-green text-sm font-semibold text-white hover:bg-tp-green-hover"
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </Button>
          </form>

          {/* Checklist Syarat & Ketentuan, Kebijakan Privasi, dan Disclaimer */}
          <div className="mt-4 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-tp-border text-tp-green focus:ring-tp-green cursor-pointer"
            />
            <label htmlFor="terms-checkbox" className="text-xs text-tp-muted leading-relaxed select-none">
              Saya telah membaca dan menyetujui{' '}
              <Link 
                to="/terms" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-tp-green hover:underline cursor-pointer"
                onClick={(e) => e.stopPropagation()} 
              >
                Syarat & Ketentuan
              </Link>
              ,{' '}
              <Link 
                to="/privacy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-tp-green hover:underline cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                Kebijakan Privasi
              </Link>
              , dan{' '}
              <Link 
                to="/disclaimer" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-tp-green hover:underline cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                Disclaimer
              </Link>{' '}
              TeachPartner.
            </label>
          </div>

          <p className="mt-6 text-center text-[13px] text-tp-muted">
            Sudah punya akun?{' '}
            <Link to="/" className="font-semibold text-tp-green hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}