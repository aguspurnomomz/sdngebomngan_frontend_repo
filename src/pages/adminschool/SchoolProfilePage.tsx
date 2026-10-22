import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { 
  //Building2, 
  Edit3, 
  Save, 
  X, 
  CheckCircle, 
  Star, Hash, Award, Flag, Phone, Mail, 
  Globe, Landmark, ExternalLink, MapPin
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

export default function SchoolProfilePage() {
  const [school, setSchool] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [schoolName, setSchoolName] = useState('')
  const [npsn, setNpsn] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [accreditation, setAccreditation] = useState('')
  const [schoolStatus, setSchoolStatus] = useState('Negeri')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [foundationName, setFoundationName] = useState('')

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
      
      // Populate form
      setSchoolName(data.school_name || '')
      setNpsn(data.npsn || '')
      setAddress(data.address || '')
      setCity(data.city || '')
      setEmail(data.email || '')
      setAccreditation(data.accreditation || '')
      setSchoolStatus(data.school_status || 'Negeri')
      setPhone(data.phone || '')
      setWebsite(data.website || '')
      setLatitude(data.latitude?.toString() || '')
      setLongitude(data.longitude?.toString() || '')
      setFoundationName(data.foundation_name || '')
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
        email: email,
        accreditation: accreditation,
        school_status: schoolStatus,
        phone: phone,
        website: website,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        foundation_name: foundationName
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

  // Helper untuk kartu info di mode Read-Only
  const InfoCard = ({ icon, label, value, isLink = false, linkUrl = '' }: any) => (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 border border-blue-100">
        {icon}
      </div>
      <div className="pt-1">
        <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
        {isLink && value ? (
          <a 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-base font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            {value} <ExternalLink size={14} />
          </a>
        ) : (
          <p className="text-base font-semibold text-slate-800 break-all">{value || '-'}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 w-full">
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
      <div className="rounded-2xl border border-tp-border bg-white p-2 shadow-sm">
        {!isEditing ? (
          // ==============================
          // TAMPILAN MODE BACA (READ-ONLY)
          // ==============================
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
            <InfoCard icon={<Star size={22} />} label="Akreditasi" value={school?.accreditation} />
            <InfoCard icon={<Award size={22} />} label="Status Sekolah" value={school?.school_status} />
            
            <InfoCard 
              icon={<Hash size={22} />} 
              label="NPSN" 
              value={school?.npsn} 
              isLink={true} 
              linkUrl={`https://sekolah.data.kemendikdasmen.go.id/sekolah?keyword=${school?.npsn}`}
            />
            <InfoCard icon={<Flag size={22} />} label="Jenjang" value={school?.jenjang} />
            
            <InfoCard icon={<Phone size={22} />} label="Telepon" value={school?.phone} />
            <InfoCard icon={<Mail size={22} />} label="Email" value={school?.email} />
            
            <InfoCard 
              icon={<Globe size={22} />} 
              label="Website Sekolah" 
              value={school?.website ? "Lihat Laman" : "-"} 
              isLink={!!school?.website} 
              linkUrl={school?.website?.startsWith('http') ? school?.website : `https://${school?.website}`} 
            />
            <InfoCard icon={<Landmark size={22} />} label="Yayasan" value={school?.foundation_name} />

            {/* Baris Tambahan untuk Alamat & Koordinat */}
            <div className="md:col-span-2 border-t border-slate-100 mt-2 pt-4">
               <div className="flex items-start gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                    <MapPin size={22} />
                  </div>
                  <div className="pt-1">
                    <p className="text-sm text-slate-500 font-medium mb-1">Alamat Lengkap</p>
                    <p className="text-base font-semibold text-slate-800 leading-relaxed">
                      {school?.address || '-'}
                      {school?.city && `, ${school?.city}`}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          // ==============================
          // TAMPILAN MODE EDIT (FORM)
          // ==============================
          <form onSubmit={handleUpdateProfile} className="space-y-5 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Nama Sekolah *</label>
                <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">NPSN *</label>
                <input type="text" value={npsn} onChange={(e) => setNpsn(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Akreditasi (Opsional)</label>
                <input type="text" value={accreditation} onChange={(e) => setAccreditation(e.target.value)} placeholder="Contoh: A" className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Status Sekolah</label>
                <select value={schoolStatus} onChange={(e) => setSchoolStatus(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green">
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Kota / Kabupaten</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Email Resmi Sekolah</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Telepon (Opsional)</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Website (Opsional)</label>
                <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tp-muted mb-1">Alamat Lengkap</label>
              <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Latitude (Opsional)</label>
                <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Longitude (Opsional)</label>
                <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-tp-muted mb-1">Yayasan (Opsional)</label>
              <input type="text" value={foundationName} onChange={(e) => setFoundationName(e.target.value)} className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green" />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-tp-border">
              <button type="button" onClick={() => setIsEditing(false)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50">
                <X size={16} /> Batal
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50">
                <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}