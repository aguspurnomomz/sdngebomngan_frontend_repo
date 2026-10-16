import { Link } from 'react-router-dom'
import teachpartnerIcon from '../assets/logo-new-version.png'
import { Button } from '../components/ui/button'

export default function DisclaimerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-tp-bg bg-[radial-gradient(ellipse_at_0%_0%,rgba(125,211,167,0.25),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(15,76,54,0.12),transparent_45%)]">
      {/* Header Sederhana */}
      <header className="flex items-center justify-between border-b border-tp-border bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img 
            src={teachpartnerIcon} 
            alt="SkoolaGo" 
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

      {/* Konten Disclaimer AI */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-tp-border bg-white p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-tp-green">Dokumen Legal</span>
            <h1 className="mt-1 mb-2 text-2xl font-bold tracking-tight text-tp-text sm:text-3xl">
              Disclaimer AI
            </h1>
            <p className="text-xs text-tp-faint">Berlaku sejak 14 Juli 2026</p>
          </div>

          <p className="text-sm text-tp-muted leading-relaxed">
            SkoolaGo adalah asisten AI untuk membantu guru menyusun perangkat pembelajaran. Dokumen ini menegaskan batasan output AI dan tanggung jawab profesional guru sebagai pengguna.
          </p>

          <div className="space-y-6 text-sm text-tp-muted leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">1. Sifat Output AI</h2>
              <p>
                SkoolaGo menggunakan model AI generatif (Google Gemini dan sejenisnya) untuk membantu menyusun draft perangkat pembelajaran. Seluruh output bersifat DRAFT/ASISTEN, bukan dokumen final yang siap pakai tanpa peninjauan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">2. Wajib Diverifikasi Guru</h2>
              <p>Sebelum digunakan di kelas atau dikumpulkan ke pihak sekolah/pengawas, Pengguna WAJIB memeriksa, mengedit, dan memvalidasi output AI berdasarkan:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-1">
                <li>Kesesuaian dengan CP/ATP resmi dari Kemendikdasmen dan kebijakan kurikulum yang berlaku.</li>
                <li>Konteks lokal sekolah, karakteristik siswa, dan sarana yang tersedia.</li>
                <li>Akurasi faktual materi ajar (AI dapat melakukan halusinasi/kesalahan fakta).</li>
                <li>Kesesuaian tingkat kesulitan soal dan kunci jawaban.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">3. Bukan Otoritas Kurikulum</h2>
              <p>
                SkoolaGo BUKAN pengganti Kemendikdasmen, Dinas Pendidikan, pengawas sekolah, atau MGMP/KKG. Referensi kurikulum yang kami tampilkan bersifat bantuan penyusunan, bukan sumber hukum resmi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">4. Batas Akurasi</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>AI dapat menghasilkan informasi yang tampak meyakinkan namun keliru (halusinasi).</li>
                <li>Terjemahan istilah asing, rumus, dan angka wajib diperiksa ulang oleh Pengguna.</li>
                <li>Gambar yang di-generate AI bersifat ilustratif dan mungkin tidak akurat secara ilmiah.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">5. Tanggung Jawab Akhir</h2>
              <p>
                Tanggung jawab akhir atas dokumen yang dikumpulkan, disampaikan ke siswa, atau digunakan dalam penilaian sepenuhnya berada di tangan Pengguna sebagai profesional pendidik. SkoolaGo tidak bertanggung jawab atas dampak akademik, administratif, atau hukum yang timbul dari pemakaian output AI tanpa verifikasi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">6. Etika Penggunaan</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Jangan gunakan SkoolaGo untuk menyusun karya ilmiah/skripsi/tesis atas nama pribadi tanpa disclosure penggunaan AI.</li>
                <li>Jangan gunakan untuk membuat konten yang merendahkan, diskriminatif, atau melanggar kode etik guru.</li>
                <li>Hormati privasi siswa — jangan masukkan data pribadi siswa ke dalam prompt AI.</li>
              </ul>
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
              <Link to="/privacy" className="hover:underline">Kebijakan Privasi</Link>
              <span>•</span>
              <span className="font-medium text-tp-text">Disclaimer</span>
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