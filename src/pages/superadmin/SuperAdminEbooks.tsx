import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface Ebook {
  id: string
  judul: string
  jenjang: string
  mata_pelajaran: string
  kategori: string
  cover_url: string
  file_url: string
  created_at: string
}

export default function SuperAdminEbooks() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // State untuk Pagination (10 item per halaman)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // State Form Tambah E-book
  const [judul, setJudul] = useState('')
  const [jenjang, setJenjang] = useState('SMA/MA')
  const [mataPelajaran, setMataPelajaran] = useState('')
  const [kategori, setKategori] = useState('Kurikulum Merdeka') 
  const [coverUrl, setCoverUrl] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  const adminToken = localStorage.getItem('superadmin_token')

  const fetchEbooks = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/superadmin/ebooks`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      setEbooks(res.data.ebooks || [])
    } catch (err) {
      console.error('Gagal memuat e-book:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEbooks()
  }, [])

  const handleCreateEbook = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.post(
        `${API_URL}/api/superadmin/ebooks`,
        {
          judul,
          jenjang,
          mata_pelajaran: mataPelajaran,
          kategori, 
          cover_url: coverUrl,
          file_url: fileUrl,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      )
      alert('E-book berhasil ditambahkan!')
      setShowModal(false)
      setJudul('')
      setMataPelajaran('')
      setKategori('Kurikulum Merdeka')
      setCoverUrl('')
      setFileUrl('')
      fetchEbooks()
    } catch (err: any) {
      alert('Gagal menambah e-book: ' + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEbook = async (id: string, judulBuku: string) => {
    if (!confirm(`Yakin ingin menghapus e-book "${judulBuku}"?`)) return

    try {
      await axios.delete(`${API_URL}/api/superadmin/ebooks/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      alert('E-book berhasil dihapus.')
      fetchEbooks()
    } catch (err: any) {
      alert('Gagal menghapus e-book: ' + (err.response?.data?.error || err.message))
    }
  }

  // Kalkulasi data untuk pagination (10 data per halaman)
  const totalPages = Math.ceil(ebooks.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentEbooks = ebooks.slice(startIndex, startIndex + itemsPerPage)

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text sm:text-[28px]">Kelola E-Book</h1>
          <p className="text-sm text-tp-muted">Tambah dan kelola daftar buku pegangan kurikulum untuk guru.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-tp-green hover:bg-tp-green-hover text-white text-xs gap-1.5"
          >
            <Plus size={16} /> Tambah E-Book
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={fetchEbooks}
            className="rounded-xl border-tp-border bg-white gap-2 text-xs"
          >
            <RefreshCw size={14} /> Muat Ulang
          </Button>
        </div>
      </div>

      {/* Tabel E-Books */}
      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-tp-muted">Memuat data e-book...</div>
        ) : ebooks.length === 0 ? (
          <div className="p-12 text-center text-sm text-tp-muted">Belum ada data e-book yang tersimpan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-tp-border bg-gray-50 text-xs font-semibold uppercase tracking-wider text-tp-muted">
                <tr>
                  <th className="px-6 py-4">Judul Buku</th>
                  <th className="px-6 py-4">Jenjang</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {currentEbooks.map((b) => (
                  <tr key={b.id} className="transition hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-tp-text">{b.judul}</td>
                    <td className="px-6 py-4 text-tp-muted">{b.jenjang}</td>
                    <td className="px-6 py-4 text-tp-muted">{b.mata_pelajaran}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-tp-green border border-emerald-200">
                        {b.kategori || 'Kurikulum Merdeka'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-8 rounded-lg text-xs"
                        >
                          <a href={b.file_url} target="_blank" rel="noreferrer">
                            Lihat PDF
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEbook(b.id, b.judul)}
                          className="h-8 rounded-lg text-xs gap-1"
                        >
                          <Trash2 size={14} /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Kontrol Navigasi Pagination (10 data per halaman) */}
        {!loading && ebooks.length > 0 && (
          <div className="flex items-center justify-between border-t border-tp-border bg-gray-50/50 px-6 py-3.5 text-xs text-tp-muted">
            <div>
              Menampilkan <span className="font-semibold text-tp-text">{startIndex + 1}</span> -{' '}
              <span className="font-semibold text-tp-text">{Math.min(startIndex + itemsPerPage, ebooks.length)}</span> dari{' '}
              <span className="font-semibold text-tp-text">{ebooks.length}</span> e-book
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-8 rounded-lg gap-1 bg-white text-xs"
              >
                <ChevronLeft size={14} /> Sebelumnya
              </Button>
              <span className="font-medium text-tp-text px-1">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-8 rounded-lg gap-1 bg-white text-xs"
              >
                Selanjutnya <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah E-Book */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-tp-text">Tambah E-Book Baru</h2>
            <form onSubmit={handleCreateEbook} className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Judul Buku</Label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Kelas X SMA"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Jenjang</Label>
                  <select
                    className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-tp-text outline-none focus:border-tp-green"
                    value={jenjang}
                    onChange={(e) => setJenjang(e.target.value)}
                  >
                    <option value="SD/MI">SD/MI</option>
                    <option value="SMP/MTs">SMP/MTs</option>
                    <option value="SMA/MA">SMA/MA</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Mata Pelajaran</Label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Matematika"
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Kategori Buku</Label>
                <select
                  className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-tp-text outline-none focus:border-tp-green"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                >
                  <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                  <option value="Kurikulum 2013">Kurikulum 2013</option>
                  <option value="Nonteks">Nonteks (Buku Pengayaan/Literasi)</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">URL File PDF (Link Resmi / Cloudflare R2)</Label>
                <Input
                  type="url"
                  required
                  placeholder="https://..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">URL Cover Buku (Opsional)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border-tp-border bg-white text-xs font-semibold text-tp-text hover:bg-gray-50 h-10"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-tp-green hover:bg-tp-green-hover text-white text-xs font-semibold h-10"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan E-Book'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}