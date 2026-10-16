import { useEffect, useState } from 'react'
import { api } from '../../lib/axios'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Ban,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react'

interface SchoolItem {
  id: string
  school_name: string
  npsn: string
  address: string
  is_active: boolean
  created_at: string
}

interface SchoolAdminItem {
  id: string
  full_name: string
  email: string
  nip: string
  is_active: boolean
  created_at: string
  school_name: string
  npsn: string
}

export default function SuperAdminSchools() {
  const [schools, setSchools] = useState<SchoolItem[]>([])
  const [admins, setAdmins] = useState<SchoolAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [schoolName, setSchoolName] = useState('')
  const [npsn, setNpsn] = useState('')
  const [address, setAddress] = useState('')
  const [jenjang, setJenjang] = useState('SMP')

  const [selectedSchoolID, setSelectedSchoolID] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminFullName, setAdminFullName] = useState('')
  const [adminNip, setAdminNip] = useState('')

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<SchoolItem | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [statusSubmitting, setStatusSubmitting] = useState(false)
  const [statusError, setStatusError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('superadmin_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [resSchools, resAdmins] = await Promise.all([
        api.get('/api/superadmin/schools', { headers }),
        api.get('/api/superadmin/school-admins', { headers }),
      ])

      setSchools(resSchools.data.schools || [])
      setAdmins(resAdmins.data.admins || [])
      setErrorMsg('')
    } catch (err) {
      setErrorMsg('Gagal memuat data sekolah dan admin.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRegisterSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setErrorMsg('')
      setSuccessMsg('')
      const token = localStorage.getItem('superadmin_token')

      const res = await api.post(
        '/api/superadmin/schools',
        {
          school_name: schoolName,
          npsn,
          address,
          jenjang,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setSuccessMsg(`Sekolah "${res.data.school_name}" berhasil didaftarkan!`)
      setSchoolName('')
      setNpsn('')
      setAddress('')
      setJenjang('SMP')
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Gagal mendaftarkan sekolah.')
    }
  }

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setErrorMsg('')
      setSuccessMsg('')
      const token = localStorage.getItem('superadmin_token')

      await api.post(
        '/api/superadmin/school-admins',
        {
          school_id: selectedSchoolID,
          email: adminEmail,
          password: adminPassword,
          full_name: adminFullName,
          nip: adminNip,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setSuccessMsg('Akun Admin Sekolah berhasil dibuat!')
      setSelectedSchoolID('')
      setAdminEmail('')
      setAdminPassword('')
      setAdminFullName('')
      setAdminNip('')
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Gagal membuat akun admin sekolah.')
    }
  }

  const handleOpenStatusModal = (school: SchoolItem) => {
    setSelectedSchool(school)
    setStatusReason('')
    setStatusError('')
    setIsStatusModalOpen(true)
  }

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchool) return
    if (statusReason.trim().length < 5) {
      setStatusError('Alasan wajib diisi (minimal 5 karakter)')
      return
    }

    setStatusSubmitting(true)
    setStatusError('')

    try {
      const token = localStorage.getItem('superadmin_token')
      const newStatus = !selectedSchool.is_active

      const res = await api.patch(
        `/api/superadmin/schools/${selectedSchool.id}/status`,
        {
          is_active: newStatus,
          reason: statusReason.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Bangun pesan sukses dengan detail
      let msg = res.data?.message || 'Status sekolah berhasil diubah'
      if (!newStatus && res.data?.auto_closed_sessions > 0) {
        msg += ` (${res.data.auto_closed_sessions} sesi absensi ditutup otomatis)`
      }

      setSuccessMsg(msg)
      setIsStatusModalOpen(false)
      setSelectedSchool(null)
      await fetchData()
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err: any) {
      setStatusError(err.response?.data?.error || 'Gagal mengubah status sekolah')
    } finally {
      setStatusSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text">
          Manajemen Sekolah B2B
        </h1>
        <p className="text-sm text-tp-muted">
          Daftarkan institusi sekolah dan kelola akun Admin Sekolah.
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form Pendaftaran Sekolah */}
        <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-tp-text flex items-center gap-2">
            <Building2 size={20} className="text-tp-green" /> Tambah Sekolah Baru
          </h2>
          <form onSubmit={handleRegisterSchool} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                Jenjang Sekolah
              </label>
              <select
                required
                className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value)}
              >
                <option value="SD">SD (Sekolah Dasar)</option>
                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                <option value="SMK">Sekolah Menengah Kejuruan (SMK)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                placeholder="Contoh: SMAN 1 Bandung"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                NPSN
              </label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                placeholder="Nomor Pokok Sekolah Nasional"
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                Alamat
              </label>
              <textarea
                className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                placeholder="Alamat lengkap sekolah"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-tp-green text-white font-semibold py-2.5 hover:bg-tp-green-hover"
            >
              Daftarkan Sekolah
            </Button>
          </form>
        </div>

        {/* Form Pendaftaran Admin Sekolah */}
        <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-tp-text flex items-center gap-2">
            <Plus size={20} className="text-tp-green" /> Buat Akun Admin Sekolah
          </h2>
          <form onSubmit={handleRegisterAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                Pilih Sekolah
              </label>
              <select
                required
                className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                value={selectedSchoolID}
                onChange={(e) => setSelectedSchoolID(e.target.value)}
              >
                <option value="">-- Pilih Institusi Sekolah --</option>
                {schools
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.school_name} (NPSN: {s.npsn})
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                  Nama Lengkap Admin
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  placeholder="Nama Admin"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                  NIP / Identitas
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  placeholder="Opsional"
                  value={adminNip}
                  onChange={(e) => setAdminNip(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                  Email Login
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  placeholder="admin@sekolah.sch.id"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-tp-muted mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  placeholder="Minimal 6 karakter"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-tp-green text-white font-semibold py-2.5 hover:bg-tp-green-hover"
            >
              Buat Akun Admin
            </Button>
          </form>
        </div>
      </div>

      {/* Tabel Daftar Sekolah */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-tp-text">
          Daftar Sekolah Terdaftar ({schools.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tp-border bg-tp-bg text-xs uppercase text-tp-muted">
              <tr>
                <th className="px-4 py-3">Nama Sekolah</th>
                <th className="px-4 py-3">NPSN</th>
                <th className="px-4 py-3">Alamat</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal Dibuat</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-tp-muted">
                    Memuat data sekolah...
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-tp-muted">
                    Belum ada sekolah terdaftar.
                  </td>
                </tr>
              ) : (
                schools.map((s) => (
                  <tr key={s.id} className="hover:bg-tp-bg/50">
                    <td className="px-4 py-3 font-semibold text-tp-text">{s.school_name}</td>
                    <td className="px-4 py-3 text-tp-muted">{s.npsn}</td>
                    <td className="px-4 py-3 text-tp-muted max-w-[250px] truncate">
                      {s.address || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          s.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {s.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-tp-muted text-xs">
                      {new Date(s.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleOpenStatusModal(s)}
                          className={`p-2 rounded-lg transition-colors ${
                            s.is_active
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={s.is_active ? 'Nonaktifkan Sekolah' : 'Aktifkan Kembali Sekolah'}
                        >
                          {s.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel Daftar Admin Sekolah */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-tp-text flex items-center gap-2">
          <ShieldAlert size={18} className="text-tp-green" /> Daftar Akun Admin Sekolah (
          {admins.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tp-border bg-tp-bg text-xs uppercase text-tp-muted">
              <tr>
                <th className="px-4 py-3">Nama Admin</th>
                <th className="px-4 py-3">Email Login</th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Institusi Sekolah</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat Pada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-tp-muted">
                    Memuat data admin...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-tp-muted">
                    Belum ada akun admin sekolah yang dibuat.
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-tp-bg/50">
                    <td className="px-4 py-3 font-semibold text-tp-text">{a.full_name}</td>
                    <td className="px-4 py-3 text-tp-muted">{a.email}</td>
                    <td className="px-4 py-3 text-tp-muted">{a.nip || '-'}</td>
                    <td className="px-4 py-3 text-tp-text font-medium">
                      {a.school_name}{' '}
                      <span className="text-xs text-tp-muted">({a.npsn})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          a.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {a.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-tp-muted text-xs">
                      {new Date(a.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isStatusModalOpen && selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-tp-border pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedSchool.is_active
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {selectedSchool.is_active ? <Ban size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-tp-text">
                    {selectedSchool.is_active
                      ? 'Nonaktifkan Sekolah'
                      : 'Aktifkan Kembali Sekolah'}
                  </h3>
                  <p className="text-[11px] text-tp-muted mt-0.5">
                    {selectedSchool.school_name} • NPSN {selectedSchool.npsn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-tp-muted hover:text-tp-text p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error */}
            {statusError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-800 font-medium">{statusError}</span>
              </div>
            )}

            {/* Warning: Saat nonaktifkan */}
            {selectedSchool.is_active && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <p className="text-[11px] font-bold text-amber-800">
                    Perhatian sebelum menonaktifkan:
                  </p>
                </div>
                <ul className="text-[11px] text-amber-800 space-y-1 ml-1">
                  <li>• Semua admin sekolah tidak bisa login</li>
                  <li>• Semua sesi absensi aktif akan ditutup otomatis</li>
                  <li>• Siswa tidak bisa melakukan scan absensi</li>
                  <li>• Data tetap tersimpan dan bisa diaktifkan kembali</li>
                </ul>
              </div>
            )}

            {/* Info: Saat aktifkan */}
            {!selectedSchool.is_active && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <p className="text-[11px] font-bold text-emerald-800">
                    Setelah diaktifkan:
                  </p>
                </div>
                <ul className="text-[11px] text-emerald-800 space-y-1 ml-1">
                  <li>• Admin sekolah bisa login kembali</li>
                  <li>• Siswa bisa melakukan scan absensi</li>
                  <li>• Sesi baru bisa dibuat</li>
                </ul>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Alasan {selectedSchool.is_active ? 'Nonaktifkan' : 'Aktifkan'} *
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={
                    selectedSchool.is_active
                      ? 'Contoh: Langganan berakhir 22 Sep 2026'
                      : 'Contoh: Langganan diperpanjang hingga Des 2026'
                  }
                  rows={3}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green resize-none"
                  required
                  minLength={5}
                  autoFocus
                />
                <p className="text-[10px] text-tp-muted mt-1">
                  Alasan akan dicatat dalam log audit sistem
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-tp-border">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  disabled={statusSubmitting}
                  className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={statusSubmitting || statusReason.trim().length < 5}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    selectedSchool.is_active
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {statusSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : selectedSchool.is_active ? (
                    <Ban size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {statusSubmitting
                    ? 'Memproses...'
                    : selectedSchool.is_active
                    ? 'Nonaktifkan Sekolah'
                    : 'Aktifkan Sekolah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}