import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pause,
  Sparkles,
  Square,
  Video,
} from 'lucide-react'

const weekBars = [
  { day: 'S', height: 42, muted: true },
  { day: 'M', height: 68, muted: false },
  { day: 'T', height: 88, muted: false, active: true, tip: '74%' },
  { day: 'W', height: 55, muted: false },
  { day: 'T', height: 72, muted: true },
  { day: 'F', height: 48, muted: false },
  { day: 'S', height: 35, muted: true },
]

const projects = [
  { name: 'Bank Soal Matematika', due: 'Deadline: Jumat', color: 'bg-blue-100', emoji: '📊' },
  { name: 'Asesmen Bahasa Indonesia', due: 'Deadline: Senin', color: 'bg-pink-100', emoji: '📝' },
  { name: 'Modul IPA Fase D', due: 'Deadline: Rabu', color: 'bg-emerald-100', emoji: '🔬' },
  { name: 'RPP Kelas 8', due: 'Deadline: Kamis', color: 'bg-amber-100', emoji: '📚' },
]

const team = [
  { name: 'Anda', task: 'Menyusun bank soal AI', status: 'In Progress', badge: 'warning', color: 'bg-[#0f4c36]' },
  { name: 'Identitas Sekolah', task: 'Lengkapi profil perangkat', status: 'Pending', badge: 'danger', color: 'bg-sky-600' },
  { name: 'Token AI', task: 'Saldo siap digunakan', status: 'Completed', badge: 'success', color: 'bg-purple-600' },
]

const badgeClass: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600',
  info: 'bg-sky-50 text-sky-600',
}

interface DashboardOverviewProps {
  tokenBalance: number
  /** Opsional: nama guru untuk sapaan & kartu profil. Kosong = "Bapak/Ibu Guru". */
  userName?: string
}

export default function DashboardOverview({ tokenBalance, userName }: DashboardOverviewProps) {
  const navigate = useNavigate()
  const projectScroller = useRef<HTMLDivElement>(null)

  const name = userName?.trim()
  const greetingName = name || 'Bapak/Ibu Guru'
  const initial = (name || 'G').charAt(0).toUpperCase()

  const scrollProjects = (direction: 1 | -1) => {
    projectScroller.current?.scrollBy({ left: direction * 240, behavior: 'smooth' })
  }

  // const [apiResponse, setApiResponse] = useState<string>('Belum ada request.')
  // const [loadingApi, setLoadingApi] = useState<boolean>(false)

  // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // const handleTestApi = async () => {
  //   setLoadingApi(true)
  //   setApiResponse('Mengirim permintaan ke backend Go...')
  //   try {
  //     const { data: { session } } = await supabase.auth.getSession()
  //     const token = session?.access_token || ''

  //     const res = await axios.get(`${API_URL}/api/profile`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     })

  //     setApiResponse(JSON.stringify(res.data, null, 2))
  //   } catch (err: any) {
  //     setApiResponse('Gagal: ' + (err.response?.data?.error || err.message))
  //   } finally {
  //     setLoadingApi(false)
  //   }
  // }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* ====================== KOLOM UTAMA ====================== */}
      <div className="min-w-0 space-y-6">
        {/* Banner sapaan */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tp-green to-[#1a6b4a] p-6 text-white shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-tp-mint/20" />
          <div className="pointer-events-none absolute right-28 -top-6 h-24 w-24 rounded-full border-[10px] border-white/15" />
          <div className="pointer-events-none absolute -bottom-12 right-44 h-28 w-28 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-5 -left-6 h-20 w-20 rounded-full border-[10px] border-white/10" />

          <div className="relative max-w-lg py-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
              Halo, {greetingName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
              Rencanakan, prioritaskan, dan selesaikan administrasi mengajar dengan mudah.
            </p>
          </div>
        </section>

        {/* Proyek (carousel) */}
        <section aria-labelledby="proyek-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="proyek-heading" className="text-base font-bold text-tp-text">
              Proyek
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Geser proyek ke kiri"
                onClick={() => scrollProjects(-1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-tp-border bg-white text-tp-muted transition hover:text-tp-green focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green/40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Geser proyek ke kanan"
                onClick={() => scrollProjects(1)}
                className="grid h-8 w-8 place-items-center rounded-full bg-tp-green text-white transition hover:bg-tp-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green focus-visible:ring-offset-2"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            ref={projectScroller}
            role="region"
            aria-label="Daftar proyek"
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tp-green/40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {projects.map((p) => (
              <div
                key={p.name}
                className="w-[210px] shrink-0 snap-start rounded-2xl border border-tp-border bg-white p-3 shadow-sm"
              >
                <div
                  aria-hidden="true"
                  className={`grid h-28 place-items-center rounded-xl text-5xl ${p.color}`}
                >
                  {p.emoji}
                </div>
                <h3 className="mt-3 truncate text-sm font-semibold text-tp-text">{p.name}</h3>
                <div className="mt-2 flex items-center gap-1.5 border-t border-tp-border pt-2 text-xs text-tp-faint">
                  <CalendarDays size={14} className="text-tp-green" aria-hidden="true" />
                  {p.due}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Aktivitas Mingguan + Progress Perangkat */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="rounded-2xl border-tp-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-tp-text">Aktivitas Mingguan</CardTitle>
              <button type="button" className="border-0 bg-transparent p-0 text-[13px] font-semibold text-tp-green hover:underline">
                Lihat detail
              </button>
            </CardHeader>
            <CardContent>
              <div className="flex h-[140px] items-end justify-between gap-2.5 pt-4 sm:h-40">
                {weekBars.map((bar, i) => (
                  <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={`${bar.day}-${i}`}>
                    <div
                      className={`relative w-full max-w-9 rounded-t-[10px] rounded-b ${
                        bar.active
                          ? 'bg-[#3d9b6e]'
                          : bar.muted
                            ? 'bg-[repeating-linear-gradient(-45deg,#e5e7eb,#e5e7eb_4px,#f3f4f6_4px,#f3f4f6_8px)]'
                            : 'bg-tp-mint'
                      }`}
                      style={{ height: `${bar.height}%` }}
                    >
                      {bar.tip ? (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-tp-text px-[7px] py-0.5 text-[11px] font-bold text-white">
                          {bar.tip}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-medium text-tp-faint">{bar.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between rounded-2xl border-tp-border text-center shadow-sm">
            <CardHeader className="pb-2 text-left">
              <CardTitle className="text-base font-bold text-tp-text">Progress Perangkat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative my-2 mb-4 h-[110px] w-[180px]">
                <svg viewBox="0 0 180 110" className="h-[110px] w-[180px] overflow-visible">
                  <path d="M20 100 A70 70 0 0 1 160 100" fill="none" stroke="#e8eaed" strokeWidth="14" strokeLinecap="round" />
                  <path d="M20 100 A70 70 0 0 1 120 38" fill="none" stroke="#0f4c36" strokeWidth="14" strokeLinecap="round" />
                  <path d="M120 38 A70 70 0 0 1 148 70" fill="none" stroke="#7dd3a7" strokeWidth="14" strokeLinecap="round" />
                </svg>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
                  <strong className="block text-[28px] font-bold leading-none tracking-tight text-tp-text">41%</strong>
                  <span className="text-xs text-tp-faint">Selesai</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3.5">
                <div className="flex items-center gap-1.5 text-xs text-tp-muted">
                  <span className="h-2 w-2 rounded-full bg-tp-green" /> Selesai
                </div>
                <div className="flex items-center gap-1.5 text-xs text-tp-muted">
                  <span className="h-2 w-2 rounded-full bg-tp-mint" /> Proses
                </div>
                <div className="flex items-center gap-1.5 text-xs text-tp-muted">
                  <span className="h-2 w-2 rounded-full bg-gray-300" /> Pending
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pengingat */}
        <section className="flex flex-col gap-4 rounded-2xl border border-tp-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-tp-text">Pengingat</h2>
            <div className="mt-2 text-xs text-tp-faint">Hari ini · 10:00</div>
            <div className="mt-1 text-lg font-bold leading-snug tracking-tight text-tp-text">
              Selesaikan identitas perangkat ajar
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-tp-muted">
              Lengkapi data sekolah & mata pelajaran agar dokumen asesmen siap dicetak.
            </p>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 gap-2 rounded-xl bg-tp-green text-white hover:bg-tp-green-hover sm:w-auto"
            onClick={() => navigate('/profile')}
          >
            <Video size={16} /> Buka Identitas
          </Button>
        </section>
      </div>

      {/* ====================== KOLOM KANAN ====================== */}
      <aside className="space-y-6">
        {/* Kartu profil */}
        <section className="overflow-hidden rounded-2xl border border-tp-border bg-white shadow-sm">
          <div className="flex flex-col items-center px-5 pt-6 text-center">
            <div
              aria-hidden="true"
              className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-tp-green to-[#1a6b4a] text-3xl font-bold text-white ring-4 ring-emerald-50"
            >
              {initial}
            </div>
            <h2 className="mt-3 text-base font-bold text-tp-text">{name || 'Guru'}</h2>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Akun Aktif
            </span>
            <p className="mt-1.5 text-xs text-tp-faint">Terverifikasi & siap pakai</p>
          </div>

          <dl className="mt-5 grid grid-cols-2 divide-x divide-tp-border px-2 pb-5 text-center">
            <div className="px-2">
              <dd className="text-2xl font-bold leading-none tracking-tight text-tp-text">12</dd>
              <dt className="mt-1.5 text-xs font-medium text-tp-muted">Perangkat Ajar</dt>
              <p className="mt-0.5 text-[11px] leading-snug text-tp-faint">Dalam penyusunan bulan ini</p>
            </div>
            <div className="px-2">
              <dd className="text-2xl font-bold leading-none tracking-tight text-tp-text">48</dd>
              <dt className="mt-1.5 text-xs font-medium text-tp-muted">Bank Soal</dt>
              <p className="mt-0.5 text-[11px] leading-snug text-tp-faint">Item soal tersimpan</p>
            </div>
          </dl>

          <div className="flex items-center justify-between gap-3 bg-tp-green px-5 py-4 text-white">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-white/80">Saldo Token AI</div>
              <div className="mt-1 text-[32px] font-bold leading-none tracking-tight">{tokenBalance}</div>
              <div className="mt-1.5 text-xs text-white/70">Siap digunakan untuk generate soal</div>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/35 bg-white/10">
              <Sparkles size={18} aria-hidden="true" />
            </span>
          </div>
        </section>

        {/* Kolaborasi & Status */}
        <Card className="rounded-2xl border-tp-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-tp-text">Kolaborasi & Status</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-[1.5px] border-tp-green bg-white px-3 text-xs text-tp-green hover:bg-emerald-50"
              onClick={() => navigate('/question-bank')}
            >
              + Tambah
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3.5">
              {team.map((member) => (
                <div className="flex items-center gap-3" key={member.name}>
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white ${member.color}`}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-[13px] font-semibold text-tp-text">{member.name}</strong>
                    <span className="block truncate text-xs text-tp-faint">{member.task}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass[member.badge] ?? badgeClass.info}`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Tracker */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-tp-green to-[#1a6b4a] p-5 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-[60px] h-[200px] w-[200px] rounded-full bg-tp-mint/20" />
          <h2 className="relative text-base font-bold text-white">Time Tracker</h2>
          <div className="relative my-5 text-center text-4xl font-bold tabular-nums tracking-wider">01:24:08</div>
          <div className="relative flex justify-center gap-3">
            <button
              type="button"
              aria-label="Jeda"
              className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-white/45 bg-white/10 text-white transition hover:bg-white/20"
            >
              <Pause size={16} />
            </button>
            <button
              type="button"
              aria-label="Stop"
              className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-white/45 bg-white/10 text-white transition hover:bg-white/20"
            >
              <Square size={14} />
            </button>
          </div>
        </section>
      </aside>
    </div>
  )
}
