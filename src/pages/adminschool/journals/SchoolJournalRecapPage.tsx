import { useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '../../../lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL

function getStartOfMonth() {
  const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
}
function getToday() { return new Date().toISOString().split('T')[0] }

export default function SchoolJournalRecapPage() {
  const [from, setFrom] = useState(getStartOfMonth())
  const [to, setTo] = useState(getToday())
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data: auth } = await supabase.auth.getSession()
      const res = await axios.get(`${API_URL}/api/school-admin/journals/rekap`, {
        params: { from, to },
        headers: { Authorization: `Bearer ${auth.session?.access_token}` },
      })
      setData(res.data.rekap || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tp-text">Rekap Jurnal Mengajar</h1>
      </div>

      <div className="flex items-center gap-3">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl border border-tp-border px-3 py-2 text-sm" />
        <span className="text-tp-muted">s/d</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl border border-tp-border px-3 py-2 text-sm" />
        <button onClick={load} className="rounded-xl bg-tp-green px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-tp-muted">Memuat rekap...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-tp-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-tp-muted">
              <tr>
                <th className="px-4 py-3">Nama Guru</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Draft</th>
                <th className="px-4 py-3">Terkumpul</th>
                <th className="px-4 py-3">Terverifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border">
              {data.map(d => (
                <tr key={d.teacher_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{d.teacher_name}</td>
                  <td className="px-4 py-3">{d.total}</td>
                  <td className="px-4 py-3 text-amber-600">{d.draft}</td>
                  <td className="px-4 py-3 text-blue-600">{d.submitted}</td>
                  <td className="px-4 py-3 text-emerald-600">{d.verified}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-tp-muted">Tidak ada data pada rentang tanggal ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}