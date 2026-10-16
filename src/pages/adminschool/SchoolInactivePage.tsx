import { supabase } from '../../lib/supabaseClient'
import { AlertTriangle, LogOut, Mail, Phone } from 'lucide-react'

export default function SchoolInactivePage() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen grid place-items-center bg-tp-bg p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-tp-border p-8 shadow-sm">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={32} className="text-amber-600" />
        </div>

        <h1 className="text-xl font-bold text-tp-text mb-2">
          Akun Sekolah Dinonaktifkan
        </h1>

        <p className="text-sm text-tp-muted mb-6 leading-relaxed">
          Akun sekolah Anda saat ini <strong className="text-tp-text">dinonaktifkan</strong>.
          Untuk mengaktifkan kembali, silakan hubungi administrator SkoolaGo
          atau selesaikan administrasi langganan sekolah Anda.
        </p>

      
        {/* <div className="rounded-xl bg-gray-50 border border-tp-border p-4 text-left mb-6">
          <p className="text-xs font-bold text-tp-text mb-2">
            Silahkan :
          </p>
          <ul className="space-y-1.5 text-[11px] text-tp-muted">
            <li className="flex items-start gap-1.5">
              <span className="text-tp-green font-bold">1.</span>
              <span>Hubungi customer support TeachPartner</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-tp-green font-bold">2.</span>
              <span>Konfirmasi status langganan sekolah Anda</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-tp-green font-bold">3.</span>
              <span>Selesaikan pembayaran jika diperlukan</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-tp-green font-bold">4.</span>
              <span>Tunggu verifikasi dari administrator</span>
            </li>
          </ul>
        </div> */}

        <div className="rounded-xl border border-tp-border p-3 mb-6 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-muted mb-2">
            Kontak Support
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-tp-text">
              <Mail size={12} className="text-tp-green shrink-0" />
              <span>support@skoolago.com</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-tp-text">
              <Phone size={12} className="text-tp-green shrink-0" />
              <span>+62 858-6444-3850</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-tp-green px-5 py-3 text-sm font-semibold text-white hover:bg-tp-green-hover transition-colors"
        >
          <LogOut size={16} />
          Kembali
        </button>

        {/* Footer note */}
        <p className="text-[10px] text-tp-muted mt-4">
            Copyright © 2025 - 2026 {' '}
            <a 
              href="https://skoolago.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black/70 hover:text-black transition-colors duration-200 underline-offset-2 hover:underline"
            >
              SkoolaGo. All Rights Reserved.
            </a>
        </p>
      </div>
    </div>
  )
}