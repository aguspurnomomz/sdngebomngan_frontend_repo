import { useEffect, useState } from "react";
// import CrispChat from '../components/CrispChat'
import type { 
    ComponentType, 
} from "react";
import { Link } from "react-router-dom";
import heroBg from "../assets/hero/studdent_study.png";
import heroBgDark from "../assets/hero/studdent_study_dark.png";
import logoBrand from "../assets/skoolago_typograph_brand.png";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Layers,
  Mail,
  Menu,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";

const LOGIN_PATH = "/pilih-portal"; 
const BRAND_NAME = "SkoolaGo";
const CONTACT_EMAIL = "support@skoolago.com"; 
const CONTACT_PHONE = "+62 858-6444-3850"; 

const ASSETS = {
  heroBackground: "",
  hero: heroBg,
  heroDark: heroBgDark,
  logo: logoBrand,
  logoDark: "",
};

type Theme = "light" | "dark";
const THEME_KEY = "skoolago-theme";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage belum ada */
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
  title: string;
  description: string;
  badge?: string;
}

interface Faq {
  question: string;
  answer: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tentang Program", href: "#tentang" },
  { label: "Fitur Guru & Admin", href: "#fitur" },
  { label: "Akses Siswa", href: "#siswa" },
  { label: "FAQ", href: "#faq" },
];

const HERO_POINTS = [
  "Program hibah kolaborasi digitalisasi sekolah bersama SDN Gembongan",
  "Pengelolaan administrasi kelas, jurnal, dan ujian terpusat",
  "Akses ujian praktis bagi siswa tanpa perlu membuat akun",
];

const TEACHER_FEATURES: Feature[] = [
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
];

const ADMIN_FEATURES: Feature[] = [
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

const FAQS: Faq[] = [
  {
    question: `Apa bentuk kerja sama antara ${BRAND_NAME} dan SDN Gembongan?`,
    answer: `Kerja sama ini merupakan program hibah digitalisasi sekolah di mana ${BRAND_NAME} menyediakan infrastruktur manajemen akademik dan pembelajaran digital untuk mendukung operasional di SDN Gembongan.`,
  },
  {
    question: "Bagaimana cara siswa mengikuti ujian tanpa akun?",
    answer: "Siswa dapat mengakses soal ujian secara langsung melalui tautan (link) khusus yang dibagikan oleh guru, kemudian memasukkan kode token ujian yang valid untuk mulai mengerjakan.",
  },
  {
    question: "Bagaimana kredensial atau akun awal sekolah dibuat?",
    answer: "Pembuatan akun dan kredensial awal untuk pihak sekolah dikelola secara terpusat oleh tim Superadmin SkoolaGo guna memastikan keamanan dan kesiapan sistem.",
  },
  {
    question: "Kapan fitur absensi dan akun kepala sekolah akan dirilis?",
    answer: "Saat ini modul absensi digital dan portal khusus Kepala Sekolah sedang dalam tahap pengembangan akhir dan persiapan peluncuran.",
  },
];

const SectionHeading = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="mx-auto max-w-2xl text-center">
    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h2>
    {subtitle && <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{subtitle}</p>}
  </div>
);

const Logo = ({ onDark = false }: { onDark?: boolean }) => (
  <Link to="/" className="flex items-center" aria-label={`${BRAND_NAME} beranda`}>
    {onDark ? (
      <img
        src={ASSETS.logoDark || ASSETS.logo}
        alt={`Logo ${BRAND_NAME}`}
        className="h-10 w-auto object-contain"
      />
    ) : (
      <>
        <img
          src={ASSETS.logo}
          alt={`Logo ${BRAND_NAME}`}
          className={`h-10 w-auto object-contain ${ASSETS.logoDark ? "dark:hidden" : ""}`}
        />
        {ASSETS.logoDark && (
          <img
            src={ASSETS.logoDark}
            alt={`Logo ${BRAND_NAME}`}
            className="hidden h-10 w-auto object-contain dark:block"
          />
        )}
      </>
    )}
  </Link>
);

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
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

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
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Masuk Portal
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-gray-100 bg-white p-2 shadow-md dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-gray-800"
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

const Hero = () => (
  <section className="relative -mt-[68px] min-h-[600px] overflow-hidden bg-gradient-to-b from-emerald-100 via-emerald-50 to-white pt-[68px] dark:from-emerald-950 dark:via-gray-900 dark:to-gray-950 lg:min-h-[700px]">
    <div className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 lg:pt-24">
      <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
        Proyek Hibah Digitalisasi Sekolah • SkoolaGo & SDN Gembongan
      </span>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
        Kolaborasi Modernisasi Administrasi dan Pembelajaran Akademik
      </h1>
      <p className="mt-4 text-base text-gray-600 dark:text-gray-300 sm:text-lg">
        Platform terpadu untuk mendukung kegiatan belajar mengajar, pengelolaan data sekolah, dan pelaksanaan ujian digital di SDN Gembongan.
      </p>

      <ul className="mt-8 flex flex-wrap justify-center gap-4 text-left">
        {HERO_POINTS.map((point) => (
          <li key={point} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          to={LOGIN_PATH}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Masuk ke Portal Sekolah
          <ArrowRight className="h-5 w-5" />
        </Link>
        <a
          href="#fitur"
          className="inline-flex items-center rounded-full border border-emerald-600 bg-white px-8 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500 dark:bg-transparent dark:text-emerald-300"
        >
          Lihat Fitur Aktif
        </a>
      </div>
    </div>
  </section>
);

const GrantContextSection = () => (
  <section id="tentang" className="bg-white py-16 dark:bg-gray-950 sm:py-20">
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 dark:border-emerald-900 dark:bg-gray-900/50 sm:p-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          Tentang Proyek Hibah SkoolaGo x SDN Gembongan
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
          Inisiatif ini merupakan bentuk kolaborasi hibah teknologi untuk membantu SDN Gembongan bertransisi menuju ekosistem digital. Seluruh proses pembuatan kredensial awal sekolah dan pengaturan sistem dikelola secara eksklusif melalui pengawasan <strong>Superadmin SkoolaGo</strong> guna memastikan implementasi berjalan lancar, aman, dan tepat sasaran.
        </p>
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section id="fitur" className="scroll-mt-20 bg-emerald-50/60 dark:bg-gray-900 py-16 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        title="Fitur yang Tersedia Saat Ini"
        subtitle="Modul fungsional yang dirancang khusus untuk mendukung kebutuhan guru dan pengelola admin sekolah."
      />

      {/* Fitur Guru */}
      <div className="mt-14">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">G</span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fitur untuk Guru</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEACHER_FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <Icon className="h-6 w-6" />
              </span>
              <h4 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{title}</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fitur Admin Sekolah */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white font-bold dark:bg-emerald-700">A</span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fitur untuk Admin Sekolah</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <Icon className="h-6 w-6" />
              </span>
              <h4 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{title}</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fitur Dalam Persiapan */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">P</span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sedang Dalam Tahap Persiapan</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
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
    </div>
  </section>
);

const StudentAccessSection = () => (
  <section id="siswa" className="bg-white py-16 dark:bg-gray-950 sm:py-24">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
      <SectionHeading
        title="Akses Ujian Praktis untuk Siswa"
        subtitle="Dirancang agar mudah diakses tanpa kendala teknis pembuatan akun."
      />
      <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 dark:border-emerald-900 dark:bg-gray-900/50">
        <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
          Siswa tidak perlu dibuatkan akun khusus. Untuk mengikuti evaluasi atau ujian, siswa cukup membuka <strong>tautan (link) ujian</strong> yang dibagikan oleh guru di kelas dan memasukkan <strong>kode token</strong> yang valid untuk mulai mengerjakan soal.
        </p>
      </div>
    </div>
  </section>
);

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-emerald-50/60 dark:bg-gray-900 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading title="Pertanyaan Seputar Kolaborasi Hibah" />

        <div className="mt-10 space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-gray-200 bg-white transition hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-800"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                >
                  {faq.question}
                  <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
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

const Footer = () => (
  <footer className="bg-emerald-900 dark:bg-emerald-950">
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <Logo onDark />
        <p className="mt-2 text-sm text-emerald-100">
          Proyek Hibah Digitalisasi Sekolah SkoolaGo & SDN Gembongan.
        </p>
      </div>
      <div className="text-sm text-emerald-100 space-y-1 text-center md:text-right">
        <p className="flex items-center gap-2 justify-center md:justify-end">
          <Mail className="h-4 w-4" />
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a>
        </p>
        <p className="flex items-center gap-2 justify-center md:justify-end">
          <Phone className="h-4 w-4" />
          <span>{CONTACT_PHONE}</span>
        </p>
      </div>
    </div>
    <div className="border-t border-emerald-800 dark:border-emerald-900">
      <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-emerald-200 sm:px-6">
        &copy; {new Date().getFullYear()} {BRAND_NAME}. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export default function LandingPage() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* abaikan */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen scroll-smooth bg-white font-sans text-gray-900 antialiased transition-colors dark:bg-gray-950 dark:text-gray-100">
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <main>
          <Hero />
          <GrantContextSection />
          <FeaturesSection />
          <StudentAccessSection />
          <FaqSection />
        </main>
        <Footer />
        {/* <CrispChat />  */}
      </div>
    </div>
  );
}