import { Button } from '../../../components/ui/button'

type Props = {
  disabled?: boolean
  onClick: () => void
  label?: string
}

export default function GoogleOAuthButton({
  disabled = false,
  onClick,
  label = 'Masuk Menggunakan Akun Google',
}: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={`h-10 sm:h-11 w-full gap-2.5 rounded-xl border-tp-border text-xs sm:text-sm text-tp-text hover:bg-gray-50 active:scale-[0.98] ${
        disabled ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''
      }`}
      onClick={onClick}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.17 21.31 7.26 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.19C.43 8.15 0 9.89 0 12s.43 3.85 1.19 5.39l4.08-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.26 0 3.17 2.69 1.19 6.61l4.08 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
        />
      </svg>
      {label}
    </Button>
  )
}