import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

type Props = {
  email: string
  password: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  emailPlaceholder?: string
  submitLabel?: string
  loadingLabel?: string
  showForgotPassword?: boolean
  submitDisabled?: boolean
}

export default function EmailPasswordForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading,
  emailPlaceholder = 'nama@email.com',
  submitLabel = 'Masuk',
  loadingLabel = 'Memproses...',
  showForgotPassword = true,
  submitDisabled = false,
}: Props) {
  const [showPassword, setShowPassword] = useState(false)

  const isDisabled = loading || submitDisabled

  return (
    <form className="flex flex-col gap-3.5" onSubmit={onSubmit}>
      <div className="grid gap-1">
        <Label htmlFor="login-email" className="text-xs sm:text-sm">
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
          required
          className="h-10 sm:h-11 text-sm rounded-xl"
        />
      </div>

      <div className="grid gap-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-xs sm:text-sm">
            Kata Sandi
          </Label>
          {showForgotPassword && (
            <Link
              to="/forgot-password"
              className="text-xs text-tp-green hover:underline font-medium"
            >
              Lupa kata sandi?
            </Link>
          )}
        </div>
        <div className="relative flex items-center">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="current-password"
            required
            className="h-10 sm:h-11 text-sm rounded-xl pr-10"
          />
          <button
            type="button"
            className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* T&C checkbox — DIHAPUS dari sini, dipindah ke parent (GuruLoginPage) */}

      <Button
        type="submit"
        disabled={isDisabled}
        className={`mt-1 h-10 sm:h-11 w-full bg-tp-green hover:bg-tp-green-hover text-white font-semibold rounded-xl transition active:scale-[0.98] ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? loadingLabel : submitLabel}
      </Button>
    </form>
  )
}