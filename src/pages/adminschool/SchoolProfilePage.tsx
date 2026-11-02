import { useState, useEffect, useRef } from 'react'
import { Button } from '../../components/ui/button'
import {
  Edit3, Save, X, CheckCircle, Star, Hash, Award, Flag, Phone, Mail,
  Globe, Landmark, ExternalLink, MapPin, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'


type InfoCardProps = {
  icon: React.ReactNode
  label: string
  value?: string | null
  isLink?: boolean
  linkUrl?: string
}

function InfoCard({ icon, label, value, isLink = false, linkUrl = '' }: InfoCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 border border-blue-100">
        {icon}
      </div>
      <div className="pt-1 min-w-0">
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
          <p className="text-base font-semibold text-slate-800 break-words">{value || '-'}</p>
        )}
      </div>
    </div>
  )
}

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as any)?.error || e.message
  }
  if (e instanceof Error) return e.message
  return String(e)
}

function normalizeWebsiteUrl(raw?: string | null): string {
  if (!raw) return ''
  return raw.toLowerCase().startsWith('http') ? raw : `https://${raw}`
}

function parseCoordinate(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const num = Number(trimmed)
  if (!Number.isFinite(num)) return null
  if (num < min || num > max) return null
  return num
}


type SchoolForm = {
  school_name: string
  npsn: string
  address: string
  city: string
  email: string
  accreditation: string
  school_status: string
  phone: string
  website: string
  latitude: string
  longitude: string
  foundation_name: string
}

const EMPTY_FORM: SchoolForm = {
  school_name: '',
  npsn: '',
  address: '',
  city: '',
  email: '',
  accreditation: '',
  school_status: 'Negeri',
  phone: '',
  website: '',
  latitude: '',
  longitude: '',
  foundation_name: '',
}

function schoolToForm(school: any): SchoolForm {
  if (!school) return EMPTY_FORM
  return {
    school_name: school.school_name || '',
    npsn: school.npsn || '',
    address: school.address || '',
    city: school.city || '',
    email: school.email || '',
    accreditation: school.accreditation || '',
    school_status: school.school_status || 'Negeri',
    phone: school.phone || '',
    website: school.website || '',
    latitude: school.latitude?.toString() || '',
    longitude: school.longitude?.toString() || '',
    foundation_name: school.foundation_name || '',
  }
}

export default function SchoolProfilePage() {
  const [school, setSchool] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loadError, setLoadError] = useState('')

  // Form state digabung
  const [form, setForm] = useState<SchoolForm>(EMPTY_FORM)

  const API_URL = import.meta.env.VITE_API_URL
  const successTimerRef = useRef<number | null>(null)

  const setField = <K extends keyof SchoolForm>(key: K, value: SchoolForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const getAuthToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Sesi tidak valid. Silakan login ulang.')
    }
    return session.access_token
  }

 
  const fetchSchoolProfile = async (showLoading = true) => {
    try {
      if (showLoading) setIsFetching(true)
      setLoadError('')
      const token = await getAuthToken()
      const res = await axios.get(`${API_URL}/api/school-admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res.data.school
      setSchool(data)
      setForm(schoolToForm(data))
    } catch (e: unknown) {
      console.error('Gagal memuat profil sekolah:', e)
      setLoadError(getErrorMessage(e))
    } finally {
      if (showLoading) setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchSchoolProfile(true)
  }, [API_URL])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    }
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => setSuccessMessage(''), 4000)
  }

  const handleCancelEdit = () => {
    setForm(schoolToForm(school))
    setErrorMessage('')
    setIsEditing(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    try {
      setLoading(true)
      const token = await getAuthToken()
      await axios.put(
        `${API_URL}/api/school-admin/profile`,
        {
          school_name: form.school_name,
          npsn: form.npsn,
          address: form.address,
          city: form.city,
          email: form.email,
          accreditation: form.accreditation,
          school_status: form.school_status,
          phone: form.phone,
          website: form.website,
          latitude: parseCoordinate(form.latitude, -90, 90),
          longitude: parseCoordinate(form.longitude, -180, 180),
          foundation_name: form.foundation_name,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setIsEditing(false)
      showSuccess('Data sekolah berhasil diperbarui!')
      // await agar data & form sinkron sebelum loading false
      await fetchSchoolProfile(false)
    } catch (e: unknown) {
      console.error('Gagal memperbarui profil sekolah:', e)
      setErrorMessage(getErrorMessage(e))
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

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold text-red-800 mb-3">
          Gagal memuat profil sekolah
        </p>
        <p className="text-xs text-red-700 mb-4">{loadError}</p>
        <button
          onClick={() => fetchSchoolProfile(true)}
          className="rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  const websiteUrl = normalizeWebsiteUrl(school?.website)
  const hasWebsite = !!school?.website

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-tp-text">Kelola Profil Sekolah</h1>
          <p className="text-xs text-tp-muted">
            Informasi detail institusi dan identitas operasional sekolah Anda.
          </p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => {
              setErrorMessage('')
              setIsEditing(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
          >
            <Edit3 size={16} />
            Ubah Data Sekolah
          </Button>
        )}
      </div>

      {/* Notifikasi */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
          <CheckCircle size={20} className="text-tp-green shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      <div className="rounded-2xl border border-tp-border bg-white p-2 shadow-sm">
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
            <InfoCard icon={<Star size={22} />} label="Akreditasi" value={school?.accreditation} />
            <InfoCard icon={<Award size={22} />} label="Status Sekolah" value={school?.school_status} />

            <InfoCard
              icon={<Hash size={22} />}
              label="NPSN"
              value={school?.npsn}
              isLink={!!school?.npsn}
              linkUrl={`https://sekolah.data.kemendikdasmen.go.id/sekolah?keyword=${school?.npsn ?? ''}`}
            />
            <InfoCard icon={<Flag size={22} />} label="Jenjang" value={school?.jenjang} />

            <InfoCard icon={<Phone size={22} />} label="Telepon" value={school?.phone} />
            <InfoCard icon={<Mail size={22} />} label="Email" value={school?.email} />

            <InfoCard
              icon={<Globe size={22} />}
              label="Website Sekolah"
              value={hasWebsite ? 'Lihat Laman' : '-'}
              isLink={hasWebsite}
              linkUrl={websiteUrl}
            />
            <InfoCard icon={<Landmark size={22} />} label="Yayasan" value={school?.foundation_name} />

            <div className="md:col-span-2 border-t border-slate-100 mt-2 pt-4">
              <div className="flex items-start gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                  <MapPin size={22} />
                </div>
                <div className="pt-1 min-w-0">
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
          <form onSubmit={handleUpdateProfile} className="space-y-5 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Nama Sekolah *</label>
                <input
                  type="text"
                  value={form.school_name}
                  onChange={(e) => setField('school_name', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">NPSN *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{8}"
                  title="NPSN harus 8 digit angka"
                  value={form.npsn}
                  onChange={(e) => setField('npsn', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                  required
                />
              </div>
            </div>
           
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Latitude (Opsional)</label>
                <input
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={form.latitude}
                  onChange={(e) => setField('latitude', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Longitude (Opsional)</label>
                <input
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={form.longitude}
                  onChange={(e) => setField('longitude', e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-tp-border">
              <button
                type="button"
                onClick={handleCancelEdit}
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