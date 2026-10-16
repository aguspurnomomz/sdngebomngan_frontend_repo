import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Building2, Edit3, Save, X, CheckCircle} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

export default function SchoolProfilePage() {
  const [school, setSchool] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [npsn, setNpsn] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')

  const API_URL = import.meta.env.VITE_API_URL

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchSchoolProfile = async () => {
    try {
      setIsFetching(true)
      const token = await getAuthToken()
      const res = await axios.get(`${API_URL}/api/school-admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data.school
      setSchool(data)
      setSchoolName(data.school_name || '')
      setNpsn(data.npsn || '')
      setAddress(data.address || '')
      setCity(data.city || '')
      setEmail(data.email || '')
    } catch (error) {
      console.error('Gagal memuat profil sekolah:', error)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchSchoolProfile()
  }, [API_URL])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = await getAuthToken()
      await axios.put(`${API_URL}/api/school-admin/profile`, {
        school_name: schoolName,
        npsn: npsn,
        address: address,
        city: city,
        email: email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSuccessMessage('Data sekolah berhasil diperbarui!')
      setIsEditing(false)
      fetchSchoolProfile()
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (error: any) {
      console.error('Gagal memperbarui profil sekolah:', error)
      alert('Gagal memperbarui data: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="py-12 text-center text-sm text-tp-muted">
        Memuat data informasi sekolah...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Kelola Profil Sekolah</h1>
          <p className="text-xs text-tp-muted">Informasi detail institusi dan identitas operasional sekolah Anda.</p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            <Edit3 size={16} />
            Ubah Data Sekolah
          </Button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
          <CheckCircle size={20} className="text-tp-green shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm">
        {!isEditing ? (
          // Tampilan Mode Baca (Read-only)
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-tp-border">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-tp-green/10 text-tp-green">
                <Building2 size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-tp-text">{school?.school_name}</h2>
                <p className="text-xs text-tp-muted mt-0.5">NPSN: <span className="font-semibold text-tp-text">{school?.npsn}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-tp-muted mb-1">Alamat Institusi</span>
                <p className="text-tp-text font-medium">{school?.address || '-'}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-tp-muted mb-1">Kota / Kabupaten</span>
                <p className="text-tp-text font-medium">{school?.city || '-'}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-tp-muted mb-1">Email Resmi Sekolah</span>
                <p className="text-tp-text font-medium">{school?.email || '-'}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-tp-muted mb-1">Status Lisensi B2B</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200">
                  <CheckCircle size={14} /> Aktif
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <h3 className="text-sm font-bold text-tp-text mb-2">Edit Informasi Sekolah</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">NPSN</label>
                <input
                  type="text"
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Email Resmi Sekolah</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tp-muted mb-1">Alamat Lengkap</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm text-tp-text outline-none focus:border-tp-green resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50"
              >
                <X size={16} /> Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
              >
                <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}