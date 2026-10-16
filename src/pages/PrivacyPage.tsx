import { Link } from 'react-router-dom'
import teachpartnerIcon from '../assets/logo-new-version.png'
import { Button } from '../components/ui/button'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-tp-bg bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      {/* Header Sederhana */}
      <header className="flex items-center justify-between border-b border-tp-border bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img 
            src={teachpartnerIcon} 
            alt="TeachPartner" 
            className="h-7 w-auto object-contain"
          />
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-tp-text hover:bg-transparent hover:text-tp-green text-sm font-medium p-0 h-auto"
        >
          <Link to="/">
            Kembali
          </Link>
        </Button>
      </header>

      {/* Konten Kebijakan Privasi */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-tp-border bg-white p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-tp-green">Dokumen Legal</span>
            <h1 className="mt-1 mb-2 text-2xl font-bold tracking-tight text-tp-text sm:text-3xl">
              Kebijakan Privasi
            </h1>
            <p className="text-xs text-tp-faint">Berlaku sejak 14 Juli 2026</p>
          </div>

          <p className="text-sm text-tp-muted leading-relaxed">
            Kami menghargai privasi Anda. Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak Anda atas data tersebut.
          </p>

          <div className="space-y-6 text-sm text-tp-muted leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">1. Data yang Kami Kumpulkan</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-tp-text">Data akun:</strong> nama, alamat email, dan kata sandi (terenkripsi).</li>
                <li><strong className="text-tp-text">Data profil sekolah:</strong> nama sekolah, NIP/NIK guru, mata pelajaran, kelas, dan jenjang (opsional).</li>
                <li><strong className="text-tp-text">Konten yang Anda buat:</strong> dokumen hasil generate AI, CP/TP/ATP tersimpan, dan konfigurasi modul.</li>
                <li><strong className="text-tp-text">Data pembayaran:</strong> Order ID dan status transaksi (kami tidak menyimpan nomor kartu).</li>
                <li><strong className="text-tp-text">Data teknis:</strong> alamat IP, jenis browser, dan log penggunaan untuk keperluan keamanan dan analitik.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">2. Tujuan Penggunaan Data</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Menjalankan dan meningkatkan Layanan (autentikasi, penyimpanan dokumen, personalisasi output AI).</li>
                <li>Memproses pembelian token dan verifikasi pembayaran.</li>
                <li>Mengirim notifikasi penting seputar akun, pembaruan, atau promosi (bisa di-opt-out).</li>
                <li>Analitik agregat untuk memahami pola pemakaian tanpa mengidentifikasi individu.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">3. Pihak Ketiga</h2>
              <p>Kami bekerja sama dengan penyedia teknologi berikut untuk menjalankan Layanan:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-1">
                <li><strong className="text-tp-text">Google Gemini</strong> — untuk memproses permintaan generasi teks dan gambar AI.</li>
                <li><strong className="text-tp-text">Midtrans</strong> — untuk memproses pembayaran token secara aman.</li>
                <li><strong className="text-tp-text">Penyedia cloud & database</strong> — untuk menyimpan data akun dan dokumen Anda.</li>
                <li><strong className="text-tp-text">Prompt AI:</strong> Prompt yang Anda kirim ke AI dapat diproses oleh penyedia model AI sesuai kebijakan privasi mereka masing-masing. Hindari memasukkan data pribadi siswa (NISN, nilai individu bernama, dsb.) ke dalam prompt.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">4. Penyimpanan & Retensi</h2>
              <p>
                Data akun dan dokumen disimpan selama akun aktif. Anda dapat meminta penghapusan akun kapan saja melalui kontak resmi; data akan dihapus dalam 30 hari kerja, kecuali data yang wajib disimpan oleh peraturan perpajakan/hukum yang berlaku.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">5. Keamanan</h2>
              <p>
                Kami menggunakan enkripsi in-transit (HTTPS), otentikasi berbasis token, dan Row-Level Security pada database. Namun, tidak ada sistem yang sepenuhnya bebas risiko — Pengguna wajib menjaga kerahasiaan kredensial akunnya.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">6. Hak Anda</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Meminta salinan data pribadi yang kami simpan.</li>
                <li>Meminta koreksi atau penghapusan data.</li>
                <li>Menarik persetujuan pemasaran (unsubscribe).</li>
                <li>Mengajukan keluhan terkait pemrosesan data.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">7. Cookie</h2>
              <p>
                Kami menggunakan cookie/localStorage untuk menjaga sesi login dan menyimpan preferensi. Anda dapat menghapusnya melalui pengaturan browser, namun beberapa fitur mungkin tidak berfungsi optimal.
              </p>
            </section>

            {/* Kotak Kontak */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs space-y-1">
              <span className="font-bold tracking-wider uppercase text-tp-green">Kontak</span>
              <p className="text-tp-text">
                Untuk pertanyaan terkait system kami, sliahkan hubungi <strong className="font-semibold">SkoolaGo</strong> via WhatsApp:{' '}
                <a href="https://wa.me/6285864443850" target="_blank" rel="noreferrer" className="font-semibold text-tp-green hover:underline">
                  +62 858-6444-3850
                </a>.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-tp-border flex justify-between items-center">
            <div className="flex flex-wrap gap-3 text-xs text-tp-faint">
              <Link to="/terms" className="hover:underline">Syarat & Ketentuan</Link>
              <span>•</span>
              <Link to="/privacy" className="font-medium text-tp-text">Kebijakan Privasi</Link>
              <span>•</span>
              <Link to="/disclaimer" className="hover:underline">Disclaimer</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-tp-faint">
        Copyright © 2025 - 2026 {' '}
            <a 
              href="https://skoolago.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black/70 hover:text-black transition-colors duration-200 underline-offset-2 hover:underline"
            >
              SkoolaGo. All Rights Reserved.
            </a>
      </footer>
    </div>
  )
}