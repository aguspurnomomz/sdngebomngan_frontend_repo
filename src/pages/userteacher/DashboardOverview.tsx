import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  //Plus, 
  ArrowUp, 
  Video, 
  Pause, 
  Square
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

export default function DashboardOverview({ tokenBalance }: { tokenBalance: number }) {
  const navigate = useNavigate()
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
    <div className="space-y-6">
      {/* Header Dashboard */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text sm:text-[28px]">Dashboard</h1>
          <p className="text-sm text-tp-muted">
            Rencanakan, prioritaskan, dan selesaikan administrasi mengajar dengan mudah.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
          {/* <Button
            type="button"
            className="flex-1 bg-tp-green hover:bg-tp-green-hover text-white gap-2 rounded-xl sm:flex-none"
            onClick={() => navigate('/question-bank')}
          >
            <Plus size={16} /> Buat Bank Soal
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-[1.5px] border-tp-green bg-white text-tp-green hover:bg-emerald-50 gap-2 rounded-xl sm:flex-none"
            onClick={() => navigate('/profile')}
          >
            Atur Identitas
          </Button> */}
        </div>
      </div>

       {/* <Card className="rounded-2xl border-tp-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-tp-text">
            <Terminal size={18} className="text-tp-green" /> Testing Endpoint Backend Go
          </CardTitle>
          <Button
            type="button"
            onClick={handleTestApi}
            disabled={loadingApi}
            className="bg-tp-green hover:bg-tp-green-hover text-white gap-2 rounded-xl h-9 px-4 text-xs font-semibold"
          >
            <Send size={14} /> {loadingApi ? 'Memproses...' : 'Test'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-slate-900 p-4 text-xs text-emerald-400 font-mono overflow-x-auto max-h-40">
            <pre>{apiResponse}</pre>
          </div>
        </CardContent>
      </Card> */}

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex min-h-[120px] flex-col gap-2 rounded-2xl border border-tp-green bg-tp-green p-5 text-white shadow-sm sm:min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-white/80">Saldo Token AI</span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/35 bg-white/12 text-white">
              <ArrowUp size={16} />
            </span>
          </div>
          <div className="text-[32px] font-bold leading-none tracking-tight text-white">{tokenBalance}</div>
          <div className="mt-auto text-xs text-white/70">Siap digunakan untuk generate soal</div>
        </div>

        <div className="flex min-h-[120px] flex-col gap-2 rounded-2xl border border-tp-border bg-white p-5 shadow-sm sm:min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-tp-muted">Status Akun</span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-tp-border bg-white text-tp-muted">
              <ArrowUp size={16} />
            </span>
          </div>
          <div className="text-[22px] font-bold leading-none tracking-tight text-tp-text">Aktif</div>
          <div className="mt-auto text-xs text-tp-faint">Terverifikasi & siap pakai</div>
        </div>

        <div className="flex min-h-[120px] flex-col gap-2 rounded-2xl border border-tp-border bg-white p-5 shadow-sm sm:min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-tp-muted">Perangkat Ajar</span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-tp-border bg-white text-tp-muted">
              <ArrowUp size={16} />
            </span>
          </div>
          <div className="text-[32px] font-bold leading-none tracking-tight text-tp-text">12</div>
          <div className="mt-auto text-xs text-tp-faint">Dalam penyusunan bulan ini</div>
        </div>

        <div className="flex min-h-[120px] flex-col gap-2 rounded-2xl border border-tp-border bg-white p-5 shadow-sm sm:min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-tp-muted">Bank Soal</span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-tp-border bg-white text-tp-muted">
              <ArrowUp size={16} />
            </span>
          </div>
          <div className="text-[32px] font-bold leading-none tracking-tight text-tp-text">48</div>
          <div className="mt-auto text-xs text-tp-faint">Item soal tersimpan</div>
        </div>
      </div>

      {/* Grid Bagian Tengah */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
        <Card className="rounded-2xl border-tp-border shadow-sm md:col-span-2 xl:col-span-1">
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

        <Card className="rounded-2xl border-tp-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-tp-text">Pengingat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-tp-faint">Hari ini · 10:00</div>
            <div className="text-lg font-bold leading-snug tracking-tight text-tp-text">
              Selesaikan identitas perangkat ajar
            </div>
            <p className="text-[13px] leading-relaxed text-tp-muted">
              Lengkapi data sekolah & mata pelajaran agar dokumen asesmen siap dicetak.
            </p>
            <Button
              type="button"
              className="w-full bg-tp-green hover:bg-tp-green-hover text-white gap-2 rounded-xl mt-2"
              onClick={() => navigate('/profile')}
            >
              <Video size={16} /> Buka Identitas
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-tp-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-tp-text">Proyek</CardTitle>
            {/* <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-[1.5px] border-tp-green bg-white text-tp-green hover:bg-emerald-50 h-8 px-3 text-xs"
              onClick={() => navigate('/question-bank')}
            >
              + Baru
            </Button> */}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3.5">
              {projects.map((p) => (
                <div className="flex items-center gap-3" key={p.name}>
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-sm ${p.color}`}>
                    {p.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[13px] font-semibold text-tp-text">{p.name}</strong>
                    <span className="text-xs text-tp-faint">{p.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Bagian Bawah */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
        <Card className="rounded-2xl border-tp-border shadow-sm md:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-tp-text">Kolaborasi & Status</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-[1.5px] border-tp-green bg-white text-tp-green hover:bg-emerald-50 h-8 px-3 text-xs"
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

        <Card className="rounded-2xl border-tp-border shadow-sm flex flex-col justify-between text-center">
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

        <div className="relative min-h-0 overflow-hidden rounded-2xl bg-gradient-to-br from-tp-green to-[#1a6b4a] p-5 text-white shadow-sm flex flex-col justify-between">
          <div className="pointer-events-none absolute -top-[60px] -right-10 h-[200px] w-[200px] rounded-full bg-tp-mint/20" />
          <div className="relative">
            <h3 className="text-base font-bold text-white">Time Tracker</h3>
          </div>
          <div className="relative my-5 text-center text-4xl font-bold tracking-wider tabular-nums">01:24:08</div>
          <div className="relative flex justify-center gap-3">
            <button
              type="button"
              aria-label="Jeda"
              className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-white/45 bg-white/10 text-white hover:bg-white/20 transition"
            >
              <Pause size={16} />
            </button>
            <button
              type="button"
              aria-label="Stop"
              className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-white/45 bg-white/10 text-white hover:bg-white/20 transition"
            >
              <Square size={14} />
            </button>
          </div>
        </div>
      </div>

     
    </div>
  )
}