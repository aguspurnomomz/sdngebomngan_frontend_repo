import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'
import QuestionBankPage from './QuestionBankPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, LogOut, Save} from 'lucide-react'

export default function Dashboard({ session }: { session: any }) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'question-bank'>('dashboard')
  const API_URL = import.meta.env.VITE_API_URL

  const [profile, setProfile] = useState<any>({
    nama_guru: '',
    nip_guru: '',
    nama_sekolah: '',
    mata_pelajaran: '',
    fase: '',
    kelas: '',
    semester: '',
    tahun_pelajaran: '',
    nama_kepala_sekolah: '',
    nip_kepala_sekolah: '',
    kota_kabupaten: '',
    tanggal_penandatanganan: '',
    alamat_sekolah: '',
    kecamatan_kabupaten: '',
    kode_pos: '',
    telepon_sekolah: '',
    email_sekolah: '',
    npsn: '',
    website_sekolah: ''
  })
  const [tokenBalance, setTokenBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = session.access_token
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProfile(response.data.profile)
      setTokenBalance(response.data.token_balance)
    } catch (error) {
      console.error('Gagal mengambil profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = session.access_token
      await axios.put(`${API_URL}/api/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Identitas perangkat berhasil diperbarui!')
    } catch (error) {
      console.error('Gagal memperbarui profil:', error)
      alert('Terjadi kesalahan saat menyimpan data.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-tp-muted text-sm">
        Memuat data...
      </div>
    )
  }

  if (currentView === 'question-bank') {
    return <QuestionBankPage onBack={() => setCurrentView('dashboard')} />
  }

  return (
    <div className="min-h-screen bg-tp-bg p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {/* Header Dashboard & Navigasi Bank Soal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-tp-text">Dashboard Identitas Perangkat</h1>
            <p className="text-sm text-tp-muted">Kelola data guru dan profil sekolah Anda di sini.</p>
          </div>
          <Button 
            onClick={() => setCurrentView('question-bank')}
            className="bg-sky-600 hover:bg-sky-700 text-white gap-2 rounded-xl"
          >
            <BookOpen size={16} /> Kelola Bank Soal
          </Button>
        </div>

        {/* Informasi Saldo Token & Logout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="text-sm font-medium text-emerald-900">
            Saldo Token Anda: <span className="font-bold text-emerald-700">{tokenBalance} Token</span>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => supabase.auth.signOut()}
            className="gap-1.5 rounded-xl"
          >
            <LogOut size={14} /> Logout
          </Button>
        </div>

        {/* Card Form Identitas */}
        <Card className="rounded-3xl border-tp-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Formulir Identitas</CardTitle>
            <CardDescription>Perbarui informasi identitas guru, sekolah, dan kepala sekolah.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Bagian Data Guru & Sekolah */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-tp-green">Data Guru & Sekolah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="nama_guru">Nama Guru</Label>
                    <Input id="nama_guru" name="nama_guru" placeholder="Nama Guru" value={profile.nama_guru || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="nip_guru">NIP Guru</Label>
                    <Input id="nip_guru" name="nip_guru" placeholder="NIP Guru" value={profile.nip_guru || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="nama_sekolah">Nama Sekolah</Label>
                    <Input id="nama_sekolah" name="nama_sekolah" placeholder="Nama Sekolah" value={profile.nama_sekolah || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="mata_pelajaran">Mata Pelajaran</Label>
                    <Input id="mata_pelajaran" name="mata_pelajaran" placeholder="Mata Pelajaran" value={profile.mata_pelajaran || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="kelas">Kelas</Label>
                    <Input id="kelas" name="kelas" placeholder="Kelas" value={profile.kelas || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="semester">Semester</Label>
                    <Input id="semester" name="semester" placeholder="Semester" value={profile.semester || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="tahun_pelajaran">Tahun Pelajaran</Label>
                    <Input id="tahun_pelajaran" name="tahun_pelajaran" placeholder="Tahun Pelajaran" value={profile.tahun_pelajaran || ''} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Bagian Data Kepala Sekolah & Wilayah */}
              <div className="pt-2">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-tp-green">Data Kepala Sekolah & Wilayah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="nama_kepala_sekolah">Nama Kepala Sekolah</Label>
                    <Input id="nama_kepala_sekolah" name="nama_kepala_sekolah" placeholder="Nama Kepala Sekolah" value={profile.nama_kepala_sekolah || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="nip_kepala_sekolah">NIP Kepala Sekolah</Label>
                    <Input id="nip_kepala_sekolah" name="nip_kepala_sekolah" placeholder="NIP Kepala Sekolah" value={profile.nip_kepala_sekolah || ''} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="kota_kabupaten">Kota/Kabupaten</Label>
                    <Input id="kota_kabupaten" name="kota_kabupaten" placeholder="Kota/Kabupaten" value={profile.kota_kabupaten || ''} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-tp-green hover:bg-tp-green-hover text-white font-semibold py-2.5 rounded-xl gap-2">
                <Save size={16} /> Simpan Perubahan
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}