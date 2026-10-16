import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Calendar, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

export default function SchoolAcademicYearPage() {
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newYearName, setNewYearName] = useState('')
  const [newSemester, setNewSemester] = useState('Ganjil')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchAcademicYears = async () => {
    try {
      setIsFetching(true)
      const token = await getAuthToken()
      const res = await axios.get(`${API_URL}/api/school-admin/academic-years`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAcademicYears(res.data.academic_years || [])
    } catch (error) {
      console.error('Gagal memuat tahun akademik:', error)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchAcademicYears()
  }, [API_URL])

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newYearName.trim()) return

    try {
      setLoading(true)
      const token = await getAuthToken()
      await axios.post(`${API_URL}/api/school-admin/academic-years`, {
        name: newYearName,
        semester: newSemester,
        start_date: startDate,
        end_date: endDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setNewYearName('')
      setStartDate('')
      setEndDate('')
      setIsModalOpen(false)
      fetchAcademicYears() 
    } catch (error: any) {
      console.error('Gagal menambah tahun akademik:', error)
      alert('Gagal menyimpan tahun akademik ke database: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const setActiveYear = async (id: string) => {
    try {
      const token = await getAuthToken()
      await axios.patch(`${API_URL}/api/school-admin/academic-years/${id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchAcademicYears() 
    } catch (error: any) {
      console.error('Gagal mengubah status aktif:', error)
      alert('Gagal mengaktifkan tahun akademik: ' + (error.response?.data?.error || error.message))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Tahun Akademik Sekolah</h1>
          <p className="text-xs text-tp-muted">Kelola periode tahun ajaran dan semester aktif untuk institusi Anda.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
        >
          <Plus size={16} />
          Tambah Tahun Akademik
        </Button>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-blue-900 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold mb-0.5">Catatan Penting Pengaturan Akademik</p>
          Tahun akademik yang berstatus <strong className="text-blue-700">Aktif</strong> akan menjadi acuan utama bagi seluruh aktifitas di sekolah Anda.
        </div>
      </div>

      {/* Tabel Tahun Akademik */}
      <div className="rounded-2xl border border-tp-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tp-border bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-tp-muted">
                <th className="px-6 py-3.5">Nama Tahun Ajaran</th>
                <th className="px-6 py-3.5">Semester</th>
                <th className="px-6 py-3.5">Rentang Tanggal</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border text-sm">
              {isFetching ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-tp-muted">
                    Memuat data tahun akademik...
                  </td>
                </tr>
              ) : academicYears.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-tp-muted">
                    Belum ada data tahun akademik yang dibuat. Silakan tambahkan tahun akademik.
                  </td>
                </tr>
              ) : (
                academicYears.map((item) => (
                  <tr key={item.id} className="transition hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-tp-text flex items-center gap-2.5">
                      <Calendar size={16} className="text-tp-green" />
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-tp-muted">{item.semester}</td>
                    <td className="px-6 py-4 text-xs text-tp-muted">
                      {item.start_date ? item.start_date : '-'} s/d {item.end_date ? item.end_date : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                          <CheckCircle size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!item.is_active && (
                        <button
                          type="button"
                          onClick={() => setActiveYear(item.id)}
                          className="rounded-lg border border-tp-border px-3 py-1.5 text-xs font-semibold text-tp-text transition hover:bg-tp-green/10 hover:text-tp-green"
                        >
                          Jadikan Aktif
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Tahun Akademik */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-tp-text">Tambah Tahun Akademik Baru</h3>
            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1.5">Nama Tahun Ajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: 2026/2027"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1.5">Semester</label>
                <select
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green bg-white"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1.5">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2 text-sm text-tp-text outline-none focus:border-tp-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1.5">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-tp-border px-3.5 py-2 text-sm text-tp-text outline-none focus:border-tp-green"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-sm font-semibold text-tp-muted hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-tp-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}