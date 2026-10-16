import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Save } from 'lucide-react'

let fetchPromise: Promise<any> | null = null

const gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'

export default function ProfilePage({ session }: { session: any }) {
  const [profile, setProfile] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    let isMounted = true

    const fetchProfile = async () => {
      try {
        setLoading(true)
        
        if (!fetchPromise) {
          fetchPromise = axios.get(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        }

        const res = await fetchPromise
        
        if (isMounted) {
          setProfile(res.data.profile)
        }
      } catch (err) {
        console.error('Gagal memuat profil:', err)
        if (isMounted) setProfile({})
      } finally {
        fetchPromise = null  
        if (isMounted) setLoading(false)
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [session, API_URL])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.put(`${API_URL}/api/profile`, profile, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      alert('Identitas perangkat berhasil diperbarui!')
    } catch (err) {
      alert('Gagal menyimpan profil.')
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-tp-muted">
        Memuat data identitas...
      </div>
    )
  }

  return (
    <Card className="rounded-3xl border-tp-border bg-white shadow-sm">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-tp-text">
            Identitas Perangkat & Sekolah
          </h1>
          <p className="text-sm text-tp-muted">
            Lengkapi seluruh data administrasi ini agar otomatis tersemat pada dokumen asesmen dan jurnal Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Bagian 1 */}
          <div className="space-y-4">
            <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
              1. Data Guru & Akademik
            </h3>
            <div className={gridClass}>
              <div className="grid gap-1.5">
                <Label>Nama Guru</Label>
                <Input name="nama_guru" value={profile.nama_guru || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>NIP Guru</Label>
                <Input name="nip_guru" value={profile.nip_guru || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Mata Pelajaran</Label>
                <Input name="mata_pelajaran" value={profile.mata_pelajaran || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Fase</Label>
                <Input name="fase" value={profile.fase || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Kelas</Label>
                <Input name="kelas" value={profile.kelas || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Semester</Label>
                <Input name="semester" value={profile.semester || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Tahun Pelajaran</Label>
                <Input name="tahun_pelajaran" value={profile.tahun_pelajaran || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Bagian 2 */}
          <div className="space-y-4">
            <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
              2. Data Satuan Pendidikan & Wilayah
            </h3>
            <div className={gridClass}>
              <div className="grid gap-1.5">
                <Label>Nama Sekolah</Label>
                <Input name="nama_sekolah" value={profile.nama_sekolah || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>NPSN</Label>
                <Input name="npsn" value={profile.npsn || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Alamat Sekolah</Label>
                <Input name="alamat_sekolah" value={profile.alamat_sekolah || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Kecamatan / Kabupaten</Label>
                <Input name="kecamatan_kabupaten" value={profile.kecamatan_kabupaten || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Kota / Kabupaten</Label>
                <Input name="kota_kabupaten" value={profile.kota_kabupaten || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Kode Pos</Label>
                <Input name="kode_pos" value={profile.kode_pos || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Telepon Sekolah</Label>
                <Input name="telepon_sekolah" value={profile.telepon_sekolah || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Email Sekolah</Label>
                <Input name="email_sekolah" value={profile.email_sekolah || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Website Sekolah</Label>
                <Input name="website_sekolah" value={profile.website_sekolah || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Bagian 3 */}
          <div className="space-y-4">
            <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
              3. Data Kepala Sekolah & Validasi
            </h3>
            <div className={gridClass}>
              <div className="grid gap-1.5">
                <Label>Nama Kepala Sekolah</Label>
                <Input name="nama_kepala_sekolah" value={profile.nama_kepala_sekolah || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>NIP Kepala Sekolah</Label>
                <Input name="nip_kepala_sekolah" value={profile.nip_kepala_sekolah || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-1.5">
                <Label>Tanggal Penandatanganan</Label>
                <Input name="tanggal_penandatanganan" value={profile.tanggal_penandatanganan || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="bg-tp-green hover:bg-tp-green-hover text-white rounded-xl h-11 px-6 gap-2 font-semibold"
            >
              <Save size={16} /> Simpan Seluruh Perubahan Profil
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}