import { useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '../../../lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL

export default function SchoolJournalMonitorPage() {
  const [journals, setJournals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const res = await axios.get(`${API_URL}/api/school-admin/journals`, {
          headers: { Authorization: `Bearer ${data.session?.access_token}` },
        })
        setJournals(res.data.journals || [])
      } catch (e) { console.error(e) } finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div className="p-8 text-center text-tp-muted">Memuat data...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tp-text">Monitoring Jurnal Guru</h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-tp-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-tp-muted">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Guru</th>
              <th className="px-4 py-3">Mapel / Kelas</th>
              <th className="px-4 py-3">Materi</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tp-border">
            {journals.map(j => (
              <tr key={j.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{j.journal_date}</td>
                <td className="px-4 py-3 font-medium">{j.teacher_name}</td>
                <td className="px-4 py-3">{j.subject_name} - {j.class_name}</td>
                <td className="px-4 py-3 truncate max-w-[200px]">{j.topic}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${j.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : j.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                    {j.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {journals.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-tp-muted">Belum ada data jurnal.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}