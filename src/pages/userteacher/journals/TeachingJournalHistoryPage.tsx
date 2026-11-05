import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { 
    //FileText, 
    ChevronRight 
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL

export default function TeachingJournalHistoryPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [journals, setJournals] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const res = await axios.get(`${API_URL}/api/teacher/journals`, {
          headers: { Authorization: `Bearer ${data.session?.access_token}` },
        })
        setJournals(res.data.journals || [])
      } catch (e: any) {
        setError(e?.response?.data?.error || e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="p-8 text-center text-tp-muted">Memuat riwayat...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tp-text">Riwayat Jurnal</h1>
        <p className="text-sm text-tp-muted">Semua catatan jurnal mengajar Anda.</p>
      </div>

      {error && <div className="text-rose-600 text-sm">{error}</div>}

      <div className="grid gap-3">
        {journals.length === 0 ? (
          <div className="p-8 text-center text-sm text-tp-muted border border-tp-border rounded-xl bg-white">
            Belum ada jurnal yang dibuat.
          </div>
        ) : (
          journals.map((j) => (
            <div key={j.id} onClick={() => navigate(`/journals/${j.id}`)} className="cursor-pointer flex items-center justify-between rounded-xl border border-tp-border bg-white p-4 hover:border-tp-green transition">
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 px-3 py-1 border border-slate-200">
                  <span className="text-xs font-semibold text-tp-muted">{new Date(j.journal_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-tp-text">{new Date(j.journal_date).getDate()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-tp-text">{j.subject_name} - {j.class_name}</h3>
                  <p className="text-xs text-tp-muted">{j.topic || 'Tanpa topik'}</p>
                  <div className="mt-1 flex gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full ${j.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : j.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {j.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-slate-400" size={20} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}