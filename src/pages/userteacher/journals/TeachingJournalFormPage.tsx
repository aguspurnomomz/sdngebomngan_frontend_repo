import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Save, Send, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL

const empty = {
  actual_start_time: '', actual_end_time: '',
  topic: '', learning_objectives: '', method: '', media_used: '',
  activities: '', reflection: '', assignment_given: '', next_plan: '',
  student_attendance_count: undefined as number | undefined,
  total_students: undefined as number | undefined,
}

type Student = {
  id: string
  full_name: string
  nisn: string
}

type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa'

export default function TeachingJournalFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { journalId } = useParams()
  const [params] = useSearchParams()
  const entryID = params.get('entry') || ''
  const journalDate = params.get('date') || ''

  const isEdit = !!journalId
  const [form, setForm] = useState({ ...empty })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(location.state?.meta || null)
  
  // State untuk Absensi
  const [students, setStudents] = useState<Student[]>(location.state?.students || [])
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

  // State untuk Nilai & Perkembangan & BK
  const [dailyScores, setDailyScores] = useState<Record<string, number>>({})
  const [developments, setDevelopments] = useState<Record<string, string>>({})
  const [obstacles, setObstacles] = useState('')
  const [solutions, setSolutions] = useState('')
  const [bkFollowUp, setBkFollowUp] = useState(false)

  useEffect(() => {
    if (!isEdit) {
      // Mode Tambah: Inisialisasi default jika data siswa ada dari state navigasi
      if (students.length > 0) {
        const initialAtt: Record<string, AttendanceStatus> = {}
        const initialScores: Record<string, number> = {}
        const initialDevs: Record<string, string> = {}

        students.forEach(s => {
          initialAtt[s.id] = 'hadir'
          initialScores[s.id] = 0
          initialDevs[s.id] = 'BSH'
        })

        setAttendance(initialAtt)
        setDailyScores(initialScores)
        setDevelopments(initialDevs)
        
        // Set total dan hadir otomatis
        setForm(prev => ({
          ...prev,
          total_students: students.length,
          student_attendance_count: students.length
        }))
      }
      return
    }

    // Mode Edit: Fetch data jurnal
    (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        const res = await axios.get(`${API_URL}/api/teacher/journals/${journalId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const j = res.data.journal
        setForm({
          actual_start_time: j.actual_start_time || '',
          actual_end_time:   j.actual_end_time || '',
          topic: j.topic || '', learning_objectives: j.learning_objectives || '',
          method: j.method || '', media_used: j.media_used || '',
          activities: j.activities || '', reflection: j.reflection || '',
          assignment_given: j.assignment_given || '', next_plan: j.next_plan || '',
          student_attendance_count: j.student_attendance_count ?? undefined,
          total_students: j.total_students ?? undefined,
        })
        
        // Merge meta dari state jika ada, atau dari API
        setMeta({ ...j, ...location.state?.meta })

        // Load data absensi, nilai, dan perkembangan yang sudah tersimpan
        if (location.state?.students) {
          setStudents(location.state.students)
          
          // Set default in case data lama belum punya detail
          const defaultAtt: Record<string, AttendanceStatus> = {}
          const defaultScores: Record<string, number> = {}
          const defaultDevs: Record<string, string> = {}
          
          location.state.students.forEach((s: Student) => {
            defaultAtt[s.id] = 'hadir'
            defaultScores[s.id] = 0
            defaultDevs[s.id] = 'BSH'
          })

          // Timpa dengan data tersimpan jika ada
          if (j.student_attendances) {
            j.student_attendances.forEach((a: any) => defaultAtt[a.student_id] = a.status)
          }
          if (j.daily_scores) {
            j.daily_scores.forEach((d: any) => defaultScores[d.student_id] = d.score)
          }
          if (j.student_developments) {
            j.student_developments.forEach((d: any) => defaultDevs[d.student_id] = d.status)
          }

          setAttendance(defaultAtt)
          setDailyScores(defaultScores)
          setDevelopments(defaultDevs)
        }

        setObstacles(j.obstacles || '')
        setSolutions(j.solutions || '')
        setBkFollowUp(j.bk_follow_up || false)

      } catch (e: any) {
        setError(e?.response?.data?.error || e.message)
      } finally { setLoading(false) }
    })()
  }, [isEdit, journalId, location.state]) // Hapus students.length dari dependency agar tidak infinite loop

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
      const updated = { ...prev, [studentId]: status }
      const hadirCount = Object.values(updated).filter(s => s === 'hadir').length
      
      setForm(f => ({
        ...f,
        student_attendance_count: hadirCount
      }))
      return updated
    })
  }

  const save = async (submit: boolean) => {
    setSaving(true); setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      // Siapkan payload absensi, nilai, dan perkembangan
      const student_attendances = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }))
      const daily_scores_arr = Object.entries(dailyScores).map(([student_id, score]) => ({ student_id, score }))
      const student_developments_arr = Object.entries(developments).map(([student_id, status]) => ({ student_id, status }))

      const payload = {
        ...form,
        student_attendances,
        daily_scores: daily_scores_arr,
        student_developments: student_developments_arr,
        obstacles,
        solutions,
        bk_follow_up: bkFollowUp
      }

      if (isEdit) {
        await axios.put(`${API_URL}/api/teacher/journals/${journalId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (submit) {
          await axios.post(`${API_URL}/api/teacher/journals/${journalId}/submit`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          })
        }
        navigate(`/journals/${journalId}`)
      } else {
        const res = await axios.post(`${API_URL}/api/teacher/journals`, {
          timetable_entry_id: entryID,
          journal_date: journalDate,
          ...payload,
        }, { headers: { Authorization: `Bearer ${token}` } })

        if (submit) {
          await axios.post(`${API_URL}/api/teacher/journals/${res.data.journal_id}/submit`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          })
        }
        navigate('/journals')
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-sm text-tp-muted">Memuat...</div>

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg border border-tp-border p-2 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-tp-text">{isEdit ? 'Edit Jurnal' : 'Isi Jurnal Mengajar'}</h1>
          {meta && (
            <p className="text-sm text-tp-muted">
              {meta.subject_name} · {meta.class_name} · {meta.journal_date || journalDate}
            </p>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {/* SECTION INFORMASI UMUM */}
      <div className="grid gap-4 rounded-2xl border border-tp-border bg-white p-5 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-semibold text-tp-text">Jam Mulai Aktual</label>
          <input type="time" value={form.actual_start_time} onChange={(e) => setForm({ ...form, actual_start_time: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-semibold text-tp-text">Jam Selesai Aktual</label>
          <input type="time" value={form.actual_end_time} onChange={(e) => setForm({ ...form, actual_end_time: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>

        <div className="md:col-span-2"><label className="mb-1 block text-xs font-semibold text-tp-text">Materi Pokok *</label>
          <input required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>

        <div className="md:col-span-2"><label className="mb-1 block text-xs font-semibold text-tp-text">Tujuan Pembelajaran</label>
          <textarea rows={2} value={form.learning_objectives} onChange={(e) => setForm({ ...form, learning_objectives: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>

        <div><label className="mb-1 block text-xs font-semibold text-tp-text">Metode</label>
          <input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="Ceramah, Diskusi, PjBL..." className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-semibold text-tp-text">Media</label>
          <input value={form.media_used} onChange={(e) => setForm({ ...form, media_used: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>

        <div className="md:col-span-2"><label className="mb-1 block text-xs font-semibold text-tp-text">Ringkasan Kegiatan</label>
          <textarea rows={3} value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>

        <div className="md:col-span-2"><label className="mb-1 block text-xs font-semibold text-tp-text">Refleksi</label>
          <textarea rows={3} value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>

        <div><label className="mb-1 block text-xs font-semibold text-tp-text">Tugas</label>
          <input value={form.assignment_given} onChange={(e) => setForm({ ...form, assignment_given: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-semibold text-tp-text">Rencana Berikutnya</label>
          <input value={form.next_plan} onChange={(e) => setForm({ ...form, next_plan: e.target.value })} className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" /></div>
      </div>

      {/* SECTION ABSENSI SISWA */}
      {students.length > 0 && (
        <div className="rounded-2xl border border-tp-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-tp-text">Kehadiran Siswa</h2>
            <div className="flex gap-4 text-sm">
              <span className="font-medium text-tp-muted">Total: {students.length}</span>
              <span className="font-bold text-tp-green">Hadir: {form.student_attendance_count || 0}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-tp-border bg-slate-50 text-xs uppercase text-tp-muted">
                <tr>
                  <th className="px-4 py-3">Nama Siswa</th>
                  <th className="px-4 py-3 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {students.map((student) => {
                  const currentStatus = attendance[student.id] || 'hadir'
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-tp-text">{student.full_name}</div>
                        <div className="text-xs text-tp-faint">NISN: {student.nisn || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => handleAttendanceChange(student.id, 'hadir')} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${currentStatus === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <CheckCircle2 size={14} /> Hadir
                          </button>
                          <button type="button" onClick={() => handleAttendanceChange(student.id, 'sakit')} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${currentStatus === 'sakit' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <Clock size={14} /> Sakit
                          </button>
                          <button type="button" onClick={() => handleAttendanceChange(student.id, 'izin')} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${currentStatus === 'izin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <Clock size={14} /> Izin
                          </button>
                          <button type="button" onClick={() => handleAttendanceChange(student.id, 'alpa')} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${currentStatus === 'alpa' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <XCircle size={14} /> Alpa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION NILAI & PERKEMBANGAN */}
      {students.length > 0 && (
        <div className="rounded-2xl border border-tp-border bg-white p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-tp-text">Nilai Harian & Perkembangan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-tp-border bg-slate-50 text-xs uppercase text-tp-muted">
                <tr>
                  <th className="px-4 py-3">Nama Siswa</th>
                  <th className="px-4 py-3 w-24">Nilai</th>
                  <th className="px-4 py-3">Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border">
                {students.map((student) => (
                  <tr key={`dev-${student.id}`} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-tp-text">{student.full_name}</td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" min={0} max={100}
                        value={dailyScores[student.id] || ''}
                        onChange={(e) => setDailyScores({ ...dailyScores, [student.id]: Number(e.target.value) })}
                        className="w-20 rounded-lg border border-tp-border px-2 py-1 text-sm text-center" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { code: 'BB', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                          { code: 'MB', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                          { code: 'BSH', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                          { code: 'BSB', color: 'bg-blue-100 text-blue-700 border-blue-200' }
                        ].map((dev) => (
                          <button
                            key={dev.code}
                            type="button"
                            onClick={() => setDevelopments({ ...developments, [student.id]: dev.code })}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold border transition ${
                              developments[student.id] === dev.code 
                                ? dev.color 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {dev.code}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-tp-faint">
            <strong>Keterangan:</strong> BB (Belum Berkembang), MB (Mulai Berkembang), BSH (Berkembang Sesuai Harapan), BSB (Berkembang Sangat Baik).
          </div>
        </div>
      )}

      {/* SECTION KENDALA & BK */}
      <div className="grid gap-4 rounded-2xl border border-tp-border bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold text-tp-text mb-4">Kendala & Tindak Lanjut</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-tp-text">Kendala Pembelajaran</label>
          <textarea 
            rows={3} 
            value={obstacles} 
            onChange={(e) => setObstacles(e.target.value)} 
            placeholder="Misal: Siswa sulit fokus di jam terakhir..."
            className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" 
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-tp-text">Solusi yang Diberikan</label>
          <textarea 
            rows={3} 
            value={solutions} 
            onChange={(e) => setSolutions(e.target.value)} 
            placeholder="Misal: Diberikan ice breaking sebelum materi..."
            className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm" 
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input 
              type="checkbox" 
              checked={bkFollowUp} 
              onChange={(e) => setBkFollowUp(e.target.checked)}
              className="h-4 w-4 rounded border-tp-border text-tp-green focus:ring-tp-green"
            />
            <span className="text-sm font-medium text-tp-text">
              Perlu Tindak Lanjut Bimbingan Konseling (BK)?
            </span>
          </label>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap justify-end gap-2">
        <button onClick={() => navigate(-1)} className="rounded-xl border border-tp-border px-4 py-2 text-sm font-semibold text-tp-text hover:bg-slate-50">Batal</button>
        <button disabled={saving || !form.topic} onClick={() => save(false)} className="inline-flex items-center gap-2 rounded-xl border border-tp-border px-4 py-2 text-sm font-semibold text-tp-text hover:bg-slate-50 disabled:opacity-40">
          <Save size={14} /> Simpan Draft
        </button>
        <button disabled={saving || !form.topic} onClick={() => save(true)} className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-40">
          <Send size={14} /> {saving ? 'Menyimpan...' : 'Simpan & Kumpulkan'}
        </button>
      </div>
    </div>
  )
}