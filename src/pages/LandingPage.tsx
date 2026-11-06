import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import CrispChat from '../components/CrispChat'
import heroBg from "../assets/hero/Teaching-bro-green.png";
import heroBgDark from "../assets/hero/Teaching-bro-yellow.png";
import logoBrand from "../assets/skoolago_typograph_brand.png";
import ctaLeft from "../assets/landingicon/college class-bro-green.png";
import ctaLeftDark from "../assets/landingicon/college class-bro-yellow.png";
import ctaRight from "../assets/landingicon/Work in progress-bro-green.png";
import ctaRightDark from "../assets/landingicon/Work in progress-bro-yellow.png";
import aboutUsImage from "../assets/Design team-bro-green.png";
import aboutUsImageDark from "../assets/Design team-bro-yellow.png";
import logoGembongan from "../assets/logo_gembongan.png"; 
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  ChevronDown,
  ClipboardCheck,
  LifeBuoy,
  Mail,
  Menu,
  MessagesSquare,
  Moon,
  Phone,
  Rocket,
  FileText,
  ShieldCheck,
  Layers,
  Sun,
  Users,
  X,
} from "lucide-react";

/**
 * Warna aksen: `emerald` bawaan Tailwind.
 */
// const LOGIN_PATH = "/login/admin-sekolah";
const LOGIN_PATH = "/pilih-portal"; 
const BRAND_NAME = "SkoolaGo";
const CONTACT_EMAIL = "support@skoolago.com"; 
const CONTACT_PHONE = "+62 858-6444-3850"; 

/**
 * Semua gambar/ilustrasi diatur (atau di properti `image` / `logo`
 */
const ASSETS = {
  heroBackground: "",
  hero: heroBg, // ilustrasi utama hero,640x520
  heroDark: heroBgDark,
  logo: logoBrand,
  logoDark: "", // opsional: logo versi terang untuk mode gelap (kosong = pakai logo biasa)
  ctaLeft: ctaLeft, // ilustrasi kiri banner CTA bawah, 360x300
  ctaLeftDark: ctaLeftDark,
  ctaRight: ctaRight, // ilustrasi kanan banner CTA bawah, 360x300
  ctaRightDark: ctaRightDark,
};

type Theme = "light" | "dark";
const THEME_KEY = "skoolago-theme";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage masih belum ada */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

type IconType = ComponentType<{ className?: string }>;

interface NavItem {
  label: string;
  href: string;
}


interface Feature {
  icon: IconType;
  image?: string;
  title: string;
  description: string;
  badge?: string;
}


interface Reason {
  title: string;
  description: string;
}

interface Step {
  icon: IconType;
  image?: string;
  title: string;
  description: string;
}

interface Faq {
  question: string;
  answer: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tentang Kami", href: "#tentang-kami" }, 
  { label: "Fitur", href: "#fitur" },
  { label: "FAQ", href: "#faq" },
];

const HERO_POINTS = [
  "Program kolaborasi digitalisasi sekolah bersama SDN Gembongan",
  "Pengelolaan administrasi kelas, jurnal, dan ujian terpusat",
  "Akses ujian praktis bagi siswa tanpa perlu membuat akun",
];


const FEATURES: Feature[] = [
  {
    icon: CalendarCheck,
    title: "Jadwal Mengajar",
    description: "Memantau jadwal kegiatan belajar mengajar harian secara terstruktur.",
  },
  {
    icon: FileText,
    title: "Jurnal Mengajar",
    description: "Mencatat laporan dan catatan harian aktivitas pembelajaran di kelas dengan mudah.",
  },
  {
    icon: ClipboardCheck,
    title: "Ujian",
    description: "Mengelola dan mendistribusikan evaluasi pembelajaran kepada siswa secara digital.",
  },
  {
    icon: BookOpen,
    title: "Materi Bahan Ajar",
    description: "Menyediakan dan membagikan sumber belajar digital untuk mendukung proses KBM.",
  },
    {
    icon: ShieldCheck,
    title: "Manajemen Sekolah",
    description: "Pengaturan profil dan informasi dasar operasional sekolah.",
  },
  {
    icon: Layers,
    title: "Manajemen Akademik",
    description: "Pengaturan kurikulum, tahun ajaran, dan struktur pembelajaran.",
  },
  {
    icon: Users,
    title: "Manajemen Kelas & Siswa",
    description: "Pengelolaan data rombongan belajar, penempatan kelas, dan data induk siswa.",
  },
  {
    icon: FileText,
    title: "Kelola Jurnal & Soal Ujian",
    description: "Pengawasan terhadap jurnal guru serta pengelolaan bank soal dan jadwal ujian sekolah.",
  },
];

const UPCOMING_FEATURES: Feature[] = [
  {
    icon: CalendarCheck,
    title: "Modul Absensi Digital",
    description: "Sistem pencatatan kehadiran harian siswa dan guru yang sedang dalam tahap persiapan.",
    badge: "Segera Hadir",
  },
  {
    icon: ShieldCheck,
    title: "Portal Kepala Sekolah",
    description: "Dashboard khusus pimpinan sekolah untuk memantau laporan dan evaluasi mutu pendidikan.",
    badge: "Segera Hadir",
  },
];


const REASONS: Reason[] = [
  {
    title: "Sesuai Kebutuhan Sekolah Anda",
    description:
      "Pengaturan kelas, format rapor, dan hak akses bisa disesuaikan untuk jenjang SD, SMP, SMA, hingga SMK.",
  },
  {
    title: "Pendampingan oleh Tim Berpengalaman",
    description:
      "Tim kami membantu migrasi data dan melatih guru agar semua orang nyaman memakai platform sejak hari pertama.",
  },
  {
    title: "Hemat Waktu Guru dan Staf",
    description:
      "Input data cukup sekali. Rekap, rapor, dan laporan tersusun otomatis sehingga guru punya lebih banyak waktu untuk mengajar.",
  },
  {
    title: "Data Aman dan Terkontrol",
    description:
      "Akses dibatasi berdasarkan peran: guru, kepala sekolah, dan admin hanya melihat data yang menjadi tanggung jawabnya.",
  },
];

const STEPS: Step[] = [
  {
    icon: MessagesSquare,
    title: "Konsultasi Awal",
    description:
      "Kami mendengar kebutuhan dan kebiasaan kerja sekolah Anda, lalu menyusun rencana penerapan yang realistis.",
  },
  {
    icon: Rocket,
    title: "Penerapan Platform",
    description:
      "Data siswa dan guru dipindahkan, akun dibuat, dan guru dilatih langsung sampai siap dipakai di kelas.",
  },
  {
    icon: LifeBuoy,
    title: "Dukungan Berkelanjutan",
    description:
      "Tim kami tetap tersedia untuk pertanyaan, pembaruan fitur, dan evaluasi pemakaian secara berkala.",
  },
];

const FAQS: Faq[] = [
  {
    question: `Apa itu ${BRAND_NAME}?`,
    answer: `${BRAND_NAME} adalah platform untuk civitas sekolah dalam mengelola sistem informasi manajemen sekolah mereka.`,
  },
  {
    question: "Siapa saja yang bisa memakai platform ini?",
    answer:
      "Sekolah yang ingin memulai digitalisasi sistem informasi manajemen sekolah mereka.",
  },
  {
    question: "Apakah data guru maupun siswa aman?",
    answer:
      "Akses data dibatasi berdasarkan peran (role), sehingga setiap pengguna hanya melihat data yang menjadi tanggung jawabnya sesuai dengan autentikasi role mereka.",
  },
  {
    question: "Berapa lama proses penerapan di sekolah?",
    answer:
      "Tergantung berdasarkan jumlah data dan user guru yang terlibat. Dalam konsultasi awal, kami akan memberi perkiraan waktu yang sesuai dengan sekolah Anda.",
  },
  {
    question: "Apakah bisa dipakai lewat ponsel?",
    answer:
      "Ya. Tampilan responsive menyesuaikan layar sehingga bisa dibuka dari ponsel, tablet, maupun komputer.",
  },
];


const SectionHeading = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="mx-auto max-w-2xl text-center" data-aos="fade-up">
    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h2>
    {subtitle && <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{subtitle}</p>}
  </div>
);

/** Gambar dengan placeholder bila `src` kosong. `srcDark` opsional untuk mode gelap. */
const Asset = ({
  src,
  srcDark,
  alt,
  label,
  className = "",
}: {
  src?: string;
  srcDark?: string;
  alt: string;
  label: string;
  className?: string;
}) => {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center rounded-3xl border-2 border-dashed border-emerald-300 bg-white/60 p-4 text-center text-xs font-medium text-emerald-700 dark:border-emerald-700 dark:bg-gray-900/60 dark:text-emerald-300 ${className}`}
      >
        {label}
      </div>
    );
  }

  // Tanpa versi gelap: perilaku sama seperti sebelumnya
  if (!srcDark) {
    return <img src={src} alt={alt} loading="lazy" className={`object-contain ${className}`} />;
  }

  // Ada versi gelap: className dipasang di pembungkus, gambar disilang lewat CSS
  return (
    <div className={className}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-contain dark:hidden" />
      <img
        src={srcDark}
        alt={alt}
        loading="lazy"
        className="hidden h-full w-full object-contain dark:block"
      />
    </div>
  );
};


//Non text
const Logo = ({ onDark = false }: { onDark?: boolean }) => (
  <Link to="/" className="flex items-center gap-3" aria-label={`${BRAND_NAME} beranda`}>
    {/* Logo SDN Gembongan (Dipindah ke kiri) */}
    <img
      src={logoGembongan}
      alt="Logo SDN Gembongan"
      className="h-8 w-auto object-contain sm:h-10"
    />

    {/* Garis Pembatas */}
    <span className="h-6 w-px bg-gray-300 dark:bg-gray-700" aria-hidden="true"></span>

    {/* Logo SkoolaGo (Dipindah ke kanan) */}
    <div className="flex items-center">
      {onDark ? (
        <img
          src={ASSETS.logoDark || ASSETS.logo}
          alt={`Logo ${BRAND_NAME}`}
          className="h-8 w-auto object-contain sm:h-10"
        />
      ) : (
        <>
          <img
            src={ASSETS.logo}
            alt={`Logo ${BRAND_NAME}`}
            className={`h-8 w-auto object-contain sm:h-10 ${ASSETS.logoDark ? "dark:hidden" : ""}`}
          />
          {ASSETS.logoDark && (
            <img
              src={ASSETS.logoDark}
              alt={`Logo ${BRAND_NAME}`}
              className="hidden h-8 w-auto object-contain dark:block sm:h-10"
            />
          )}
        </>
      )}
    </div>
  </Link>
);
/* Tombol ganti tema */
const ThemeToggle = ({ theme, onToggle }: { theme: Theme; onToggle: () => void }) => {
  const isDark = theme === "dark";
  const label = isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isDark}
      aria-label={label}
      title={label}
      className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
};

/* Navbar */

const Navbar = ({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-gray-100 bg-white px-4 py-2.5 shadow-md dark:border-gray-800 dark:bg-gray-900 sm:px-6"
        aria-label="Navigasi utama"
      >
        <Logo />

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm font-medium text-gray-600 transition hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <Link
            to={LOGIN_PATH}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          >
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="mx-auto mt-2 max-w-6xl rounded-3xl border border-gray-100 bg-white p-2 shadow-md dark:border-gray-800 dark:bg-gray-900 md:hidden"
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

/* Hero */
const Hero = () => (
  <section className="relative -mt-[68px] min-h-[640px] overflow-hidden bg-gradient-to-b from-emerald-100 via-emerald-50 to-white pt-[68px] dark:from-emerald-950 dark:via-gray-900 dark:to-gray-950 lg:min-h-[760px]">
    {ASSETS.heroBackground ? (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
        style={{ backgroundImage: `url(${ASSETS.heroBackground})` }}
      />
    ) : (
  
      <svg
        className="absolute inset-x-0 bottom-0 h-16 w-full text-white dark:text-gray-950 sm:h-20"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,80 C240,10 480,10 720,60 C960,110 1200,110 1440,50 L1440,120 L0,120 Z"
        />
      </svg>
    )}

    {ASSETS.hero && (
  <>
    <img
      src={ASSETS.hero}
      alt={`Guru dan siswa memakai ${BRAND_NAME}`}
      className={`pointer-events-none absolute bottom-0 right-0 z-0 h-[300px] w-auto max-w-none sm:h-[400px] lg:right-[4%] lg:h-[620px] ${
        ASSETS.heroDark ? "dark:hidden" : ""
      }`}
    />
    {ASSETS.heroDark && (
      <img
        src={ASSETS.heroDark}
        alt={`Guru dan siswa memakai ${BRAND_NAME}`}
        className="pointer-events-none absolute bottom-0 right-0 z-0 hidden h-[300px] w-auto max-w-none dark:block sm:h-[400px] lg:right-[4%] lg:h-[620px]"
      />
    )}
  </>
)}

    <div className="relative z-10 mx-auto max-w-6xl px-4 pb-80 pt-12 sm:px-6 sm:pb-96 lg:pb-40 lg:pt-20">
      <div className="max-w-xl">
        {/* <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">#GuruLebihFokus</p> */}
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
          Kolaborasi Modernisasi Administrasi dan Pembelajaran Akademik
        </h1>

        <ul className="mt-6 space-y-2.5">
          {HERO_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={LOGIN_PATH}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          >
            Mulai Sekarang
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <a
            href="#fitur"
            className="inline-flex items-center justify-center rounded-full border border-emerald-600 bg-white px-7 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500 dark:bg-transparent dark:text-emerald-300 dark:hover:bg-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          >
            Lihat Fitur Aktif
          </a>
        </div>
      </div>
    </div>
  </section>
);


/* Tentang Kami */
const AboutUs = () => (
  <section id="tentang-kami" className="scroll-mt-20 bg-white py-16 dark:bg-gray-950 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        title="Tentang Kami"
        subtitle={`Mengenal lebih dekat ${BRAND_NAME} dan misi kami untuk memajukan pendidikan Indonesia.`}
      />

      <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
        {/* Teks Penjelasan */}
        <div className="space-y-6" data-aos="fade-right">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Membangun Ekosistem Pendidikan yang Lebih Efisien
          </h3>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
            {BRAND_NAME} lahir dari kepedulian terhadap beban administrasi yang dihadapi oleh para pendidik di Indonesia. Kami percaya bahwa waktu guru lebih berharga jika digunakan untuk mendidik dan membimbing siswa, bukan tenggelam dalam tumpukan kertas dan rekap data manual.
          </p>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
            Kami mengembangkan platform yang tidak hanya memodernisasi administrasi, tetapi juga mendukung pembelajaran akademik secara terintegrasi. Kami berkomitmen untuk terus berinovasi menghadirkan solusi digital yang mudah, aman, dan relevan dengan kebutuhan sekolah.
          </p>
          
          {/* Visi & Misi Singkat */}
          <div className="grid gap-4 sm:grid-cols-2 pt-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Visi</h4>
              <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                Menjadi platform digitalisasi sekolah terdepan yang memberdayakan pendidik dan institusi pendidikan.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Misi</h4>
              <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                Menyederhanakan administrasi sekolah dan memperlancar proses belajar mengajar melalui teknologi yang inklusif.
              </p>
            </div>
          </div>
        </div>

        {/* Ilustrasi / Gambar */}
        <div className="relative flex items-center justify-center lg:justify-end" data-aos="fade-left">
            {/* Gambar Mode Terang */}
            <img
              src={aboutUsImage}
              alt="Ilustrasi Tim SkoolaGo"
              loading="lazy"
              className="h-auto w-full max-w-md object-contain dark:hidden"
            />
            {/* Gambar Mode Gelap */}
            <img
              src={aboutUsImageDark}
              alt="Ilustrasi Tim SkoolaGo"
              loading="lazy"
              className="hidden h-auto w-full max-w-md object-contain dark:block"
            />
        </div>
      </div>
    </div>
  </section>
);

/* Fitur */
const Features = () => (
  <section id="fitur" className="scroll-mt-20 bg-emerald-50/70 dark:bg-gray-900 py-16 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading title="Solusi Digital untuk Sekolah Anda" />
      {/** Todo yang sudah ada */}
      <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, image, title, description }, index) => (
          <article key={title} className="flex flex-col items-center text-center" 
            data-aos="zoom-in" 
            data-aos-delay={index * 100}>
            {image ? (
              <img src={image} alt="" loading="lazy" className="h-24 w-24 object-contain" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400">
                <Icon className="h-9 w-9" aria-hidden="true" />
              </span>
            )}
            <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
          </article>
        ))}

        <aside className="flex flex-col justify-center rounded-3xl bg-emerald-600 p-6 text-white sm:p-8">
          <h3 className="text-xl font-bold">Belum menemukan yang Anda cari?</h3>
          <p className="mt-2 text-sm text-emerald-50">
            Kami siap membantu.{" "}
            <a href="#harga" className="font-semibold underline underline-offset-2">
              Hubungi kami
            </a>
          </p>
        </aside>
      </div>
      {/** Todo yang sedang dipersiapkan */}
      <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">P</span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sedang Dalam Tahap Persiapan</h3>
        </div>
        {UPCOMING_FEATURES.map(({ icon: Icon, title, description, badge }) => (
            <div key={title} className="relative rounded-2xl bg-white p-6 shadow-sm border border-dashed border-emerald-300 dark:bg-gray-800 dark:border-gray-700">
              {badge && (
                <span className="absolute top-4 right-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  {badge}
                </span>
              )}
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                <Icon className="h-6 w-6" />
              </span>
              <h4 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{title}</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
            </div>
          ))}
      </div>
    </div>
  </section>
);

/* Mengapa memilih kami */
const WhyUs = () => {
  const spans = ["md:col-span-3", "md:col-span-2", "md:col-span-2", "md:col-span-3"];
  return (
    <section className="bg-white pb-16 dark:bg-gray-950 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title="Mengapa Memilih Kami?" />

        <div className="mt-10 grid gap-5 md:grid-cols-5">
          {REASONS.map((r, i) => (
            <article key={r.title} className={`rounded-2xl bg-gray-100 p-6 dark:bg-gray-900 sm:p-8 ${spans[i]}`}
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{r.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* Pendekatan */
const Approach = () => (
  <section className="bg-emerald-50/70 dark:bg-gray-900 py-16 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        title="Pendekatan Kami"
        subtitle="Prosesnya mudah dan efisien. Berikut langkah-langkah untuk mulai memakai platform di sekolah Anda."
      />

      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, image, title, description }) => (
          <article key={title} className="flex flex-col items-center text-center">
            {image ? (
              <img src={image} alt="" loading="lazy" className="h-32 w-32 object-contain" />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400">
                <Icon className="h-12 w-12" aria-hidden="true" />
              </span>
            )}
            <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

/* FAQ */
const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-16 dark:bg-gray-950 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title="Pertanyaan yang Sering Diajukan" />

        <div className="mt-10 grid items-start gap-4 md:grid-cols-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-gray-200 bg-white transition hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-700"
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    {faq.question}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    className="px-5 pb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* Banner CTA penutup */
const CTA = () => (
  <section className="relative overflow-hidden bg-emerald-600 dark:bg-emerald-800">
    <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-16 sm:px-6 md:grid-cols-[1fr_auto_1fr] md:pt-20">
      <Asset
        src={ASSETS.ctaLeft}
        srcDark={ASSETS.ctaLeftDark}
        alt="Ilustrasi siswa"
        label="Ilustrasi kiri (± 360 x 300)"
        className="hidden h-60 w-full md:block lg:h-72"
      />

      <div className="pb-16 text-center md:max-w-md md:pb-20 lg:max-w-xl" data-aos="fade-up">
        <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
          Bergabunglah dengan Institusi Pendidikan lain yang Tumbuh Bersama Kami
        </h2>
        {/* <p className="mt-4 text-sm text-emerald-50 sm:text-base">
          Hubungi kami dan temukan cara {BRAND_NAME} membantu guru serta sekolah Anda bekerja lebih
          ringan.
        </p> */}
        <a
          href="#harga"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600 dark:focus-visible:ring-offset-emerald-800"
        >
          Hubungi Kami
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>

      <Asset
        src={ASSETS.ctaRight}
        srcDark={ASSETS.ctaRightDark}
        alt="Ilustrasi guru"
        label="Ilustrasi kanan (± 360 x 300)"
        className="hidden h-60 w-full md:block lg:h-72"
      />
    </div>
  </section>
);

/* Footer */
const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => (
  <div>
    <h3 className="text-sm font-bold text-white">{title}</h3>
    <ul className="mt-4 space-y-2.5 text-sm text-emerald-100">
      {links.map((l) => (
        <li key={l.label}>
          <a href={l.href} className="transition hover:text-white">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => (
  <footer className="bg-emerald-900 dark:bg-emerald-950">
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <Logo onDark />
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-emerald-100">
          Jadilah bagian dari ekosistem pendidikan modern yang telah mempercayakan transformasi digitalnya kepada kami.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-emerald-100">
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
              {CONTACT_EMAIL}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>{CONTACT_PHONE}</span>
          </li>
        </ul>
      </div>

      <FooterColumn
        title="Layanan"
        links={[
          { label: "Manajemen Kelas", href: "#fitur" },
          { label: "Analisis AI", href: "#fitur" },
          { label: "Perpustakaan E-Book", href: "#fitur" },
        ]}
      />
        <FooterColumn
        title="Perusahaan"
        links={[
          { label: "Tentang Kami", href: "#tentang-kami" }, 
          { label: "Testimoni", href: "#testimoni" },
          { label: "Minta Demo", href: "#harga" },
        ]}
      />
      <FooterColumn
        title="Bantuan"
        links={[
          { label: "FAQ", href: "#faq" },
          { label: "Kebijakan Privasi", href: "/privasi" },
          { label: "Syarat dan Ketentuan", href: "/syarat-ketentuan" },
        ]}
      />
    </div>

    <div className="border-t border-emerald-800 dark:border-emerald-900">
      <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-emerald-200 sm:px-6">
        &copy; 2005 - {new Date().getFullYear()} {BRAND_NAME}. All Rights Reserved.
      </p>
    </div>
  </footer>
);

/* Halaman utama */
export default function LandingPage() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* abaikan */
    }
  }, [theme]);

  useEffect(() => {
    AOS.init({
      duration: 800, 
      once: false,    
      offset: 50,   
    });
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    // Kelas `dark` pada pembungkus ini mengaktifkan semua varian `dark:` di halaman
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen scroll-smooth bg-white font-sans text-gray-900 antialiased transition-colors dark:bg-gray-950 dark:text-gray-100 dark:[color-scheme:dark]">
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <main>
          <Hero />
          <AboutUs /> 
          <Features />
          <WhyUs />
          <Approach />
          <FaqSection />
          <CTA />
        </main>
        <Footer />
        <CrispChat />
      </div>
    </div>
  );
}
