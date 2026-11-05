import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL

export default function TeachingJournalDetailPage() {
  const { journalId } = useParams()
  const navigate = useNavigate()
  const [j, setJ] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const res = await axios.get(`${API_URL}/api/teacher/journals/${journalId}`, {
          headers: { Authorization: `Bearer ${data.session?.access_token}` },
        })
        setJ(res.data.journal)
      } catch (e) { 
        console.error(e) 
      } finally { 
        setLoading(false) 
      }
    })()
  }, [journalId])

  if (loading) return <div className="p-8 text-center text-tp-muted">Memuat detail...</div>
  if (!j) return <div className="p-8 text-center text-rose-600">Jurnal tidak ditemukan</div>

  // Helper untuk warna badge BB/MB/BSH/BSB
  const getDevColor = (status: string) => {
    switch (status) {
      case 'BB': return 'bg-rose-100 text-rose-700'
      case 'MB': return 'bg-amber-100 text-amber-700'
      case 'BSH': return 'bg-emerald-100 text-emerald-700'
      case 'BSB': return 'bg-blue-100 text-blue-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-lg border border-tp-border p-2 hover:bg-slate-50"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-bold text-tp-text">Detail Jurnal</h1>
            <p className="text-sm text-tp-muted">{j.journal_date} • {j.subject_name} • {j.class_name}</p>
          </div>
        </div>
        {(j.status === 'draft' || j.status === 'rejected') && (
          <button onClick={() => navigate(`/journals/${j.id}/edit`)} className="flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2 text-sm font-semibold text-white">
            <Edit size={14} /> Edit Jurnal
          </button>
        )}
      </div>

      {/* INFO JURNAL */}
      <div className="grid gap-4 rounded-2xl border border-tp-border bg-white p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase text-tp-muted">Materi Pokok</h3>
          <p className="text-sm font-medium text-tp-text mt-1">{j.topic || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase text-tp-muted">Tujuan Pembelajaran</h3>
          <p className="text-sm text-tp-text mt-1">{j.learning_objectives || '-'}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase text-tp-muted">Metode</h3>
          <p className="text-sm text-tp-text mt-1">{j.method || '-'}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase text-tp-muted">Media</h3>
          <p className="text-sm text-tp-text mt-1">{j.media_used || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase text-tp-muted">Kegiatan</h3>
          <p className="text-sm text-tp-text mt-1">{j.activities || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase text-tp-muted">Refleksi</h3>
          <p className="text-sm text-tp-text mt-1">{j.reflection || '-'}</p>
        </div>
      </div>

      {/* KENDALA & TINDAK LANJUT BK */}
      <div className="grid gap-4 rounded-2xl border border-tp-border bg-white p-6 md:grid-cols-2">
         <div className="md:col-span-2">
            <h2 className="text-lg font-bold text-tp-text">Kendala & Tindak Lanjut</h2>
         </div>
         <div>
            <h3 className="text-xs font-semibold uppercase text-tp-muted">Kendala Pembelajaran</h3>
            <p className="text-sm text-tp-text mt-1">{j.obstacles || '-'}</p>
         </div>
         <div>
            <h3 className="text-xs font-semibold uppercase text-tp-muted">Solusi</h3>
            <p className="text-sm text-tp-text mt-1">{j.solutions || '-'}</p>
         </div>
         <div className="md:col-span-2 flex items-center gap-2 mt-2">
            {j.bk_follow_up ? (
               <span className="flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700">
                  <AlertTriangle size={16} /> Perlu Tindak Lanjut BK
               </span>
            ) : (
               <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                  <CheckCircle2 size={16} /> Tidak Perlu Tindak Lanjut BK
               </span>
            )}
         </div>
      </div>

      {/* NILAI HARIAN & PERKEMBANGAN */}
      <div className="rounded-2xl border border-tp-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-tp-text">Nilai Harian & Perkembangan</h2>
          <div className="text-sm font-medium text-tp-muted">
             Hadir: <span className="text-tp-green">{j.student_attendance_count || 0}</span> / {j.total_students || 0}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tp-border bg-slate-50 text-xs uppercase text-tp-muted">
              <tr>
                <th className="px-4 py-3">Nama Siswa</th>
                <th className="px-4 py-3 text-center">Nilai</th>
                <th className="px-4 py-3 text-center">Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border">
              {j.daily_scores?.map((scoreData: any) => {
                 const devData = j.student_developments?.find((d: any) => d.student_id === scoreData.student_id)
                 return (
                    <tr key={scoreData.student_id} className="hover:bg-slate-50/50">
                       {/* SEKARANG MENGGUNAKAN student_name DARI BACKEND */}
                       <td className="px-4 py-3 font-medium text-tp-text">
                          {scoreData.student_name || 'Siswa Tidak Dikenal'}
                       </td>
                       <td className="px-4 py-3 text-center font-bold text-tp-green">
                          {scoreData.score}
                       </td>
                       <td className="px-4 py-3 text-center">
                          {devData ? (
                             <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${getDevColor(devData.status)}`}>
                                {devData.status}
                             </span>
                          ) : '-'}
                       </td>
                    </tr>
                 )
              })}
              
              {(!j.daily_scores || j.daily_scores.length === 0) && (
                 <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-tp-muted">
                       Tidak ada data nilai yang diinput.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-tp-faint">
          <strong>Keterangan:</strong> BB (Belum Berkembang), MB (Mulai Berkembang), BSH (Berkembang Sesuai Harapan), BSB (Berkembang Sangat Baik).
        </div>
      </div>

    </div>
  )
}