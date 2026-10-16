import { Link } from 'react-router-dom'
import teachpartnerIcon from '../assets/logo-new-version.png'
import { Button } from '../components/ui/button'

export default function TermsPage() {
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

      {/* Konten Syarat & Ketentuan */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-tp-border bg-white p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-tp-green">Dokumen Legal</span>
            <h1 className="mt-1 mb-2 text-2xl font-bold tracking-tight text-tp-text sm:text-3xl">
              Syarat & Ketentuan
            </h1>
            <p className="text-xs text-tp-faint">Berlaku sejak 14 Juli 2026</p>
          </div>

          <p className="text-sm text-tp-muted leading-relaxed">
            Dokumen ini mengatur hubungan antara Anda sebagai Pengguna dan SkoolaGo sebagai pengelola. Dengan mendaftar dan menggunakan Layanan, Anda dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan berikut.
          </p>

          <div className="space-y-6 text-sm text-tp-muted leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">1. Definisi</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-tp-text">"Layanan"</strong> berarti aplikasi web SkoolaGo yang dikelola oleh Divisi Teknologi dan Inforamasi SkoolaGo, mencakup semua modul AI untuk pembuatan perangkat pembelajaran (CP, TP, ATP, Modul Ajar, LKPD, Bank Soal, dan modul lainnya).</li>
                <li><strong className="text-tp-text">"Pengguna"</strong> adalah setiap individu yang mendaftar, mengakses, atau menggunakan Layanan, terutama guru dan tenaga kependidikan di Indonesia.</li>
                <li><strong className="text-tp-text">"Token"</strong> adalah satuan kredit internal yang digunakan untuk mengakses fitur generasi AI di dalam Layanan.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">2. Akun Pengguna</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Pengguna wajib mendaftar dengan data yang benar dan akurat (nama, email, dan informasi sekolah).</li>
                <li>Satu akun hanya untuk satu orang. Dilarang membagikan akun atau menjual akses akun ke pihak lain.</li>
                <li>Pengguna bertanggung jawab penuh atas keamanan kata sandi dan seluruh aktivitas di dalam akunnya.</li>
                <li>SkoolaGo berhak menonaktifkan akun yang terbukti disalahgunakan tanpa pengembalian dana.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">3. Lisensi Pemakaian</h2>
              <p>
                SkoolaGo memberikan lisensi terbatas, non-eksklusif, dan tidak dapat dialihkan kepada Pengguna untuk menggunakan Layanan sesuai peruntukannya, yaitu membantu penyusunan perangkat pembelajaran.
              </p>
              <p className="mt-2">
                Dokumen yang dihasilkan (DOCX/output AI) boleh digunakan, diedit, dan dicetak oleh Pengguna untuk keperluan mengajar di institusinya sendiri.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">4. Larangan</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Menggunakan Layanan untuk tujuan melanggar hukum, SARA, pornografi, atau kekerasan.</li>
                <li>Melakukan reverse engineering, scraping massal, atau mengekstrak prompt/sistem AI di balik Layanan.</li>
                <li>Menjual kembali output AI atas nama produk lain tanpa penambahan nilai edukatif yang signifikan.</li>
                <li>Menggunakan Layanan untuk membuat soal ujian nasional/terstandarisasi resmi tanpa verifikasi otoritas berwenang.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">5. Hak Kekayaan Intelektual</h2>
              <p>
                Seluruh kode, desain, prompt engineering, dan sistem SkoolaGo merupakan milik SkoolaGo dan dilindungi hukum.
              </p>
              <p className="mt-2">
                Output AI (dokumen yang di-generate) menjadi hak Pengguna sepenuhnya untuk keperluan mengajar, namun SkoolaGo tidak menjamin keunikan absolut karena AI dapat menghasilkan struktur serupa untuk input yang mirip.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">6. Pembatasan Tanggung Jawab</h2>
              <p>
                Layanan diberikan "as-is". SkoolaGo tidak menjamin akurasi 100% output AI dan tidak bertanggung jawab atas konsekuensi penggunaan output tanpa verifikasi.
              </p>
              <p className="mt-2">
                Total tanggung jawab SkoolaGo atas klaim apa pun dibatasi maksimum sebesar nilai token yang belum terpakai di akun Pengguna.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">7. Perubahan Ketentuan</h2>
              <p>
                SkoolaGo dapat memperbarui Syarat & Ketentuan sewaktu-waktu. Perubahan material akan diumumkan melalui email atau notifikasi di aplikasi. Melanjutkan penggunaan setelah perubahan berarti Pengguna menerima ketentuan baru.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-tp-text">8. Hukum yang Berlaku</h2>
              <p>
                Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia. Segala sengketa diselesaikan terlebih dahulu secara musyawarah, dan bila tidak tercapai, melalui pengadilan yang berwenang di Indonesia.
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
              <span className="font-medium text-tp-text">Syarat & Ketentuan</span>
              <span>•</span>
              <Link to="/privacy" className="hover:underline">Kebijakan Privasi</Link>
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