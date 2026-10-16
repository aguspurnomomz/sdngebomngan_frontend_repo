import React, { useState } from 'react'
import { createQuestionBank } from '../../services/questionService'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Plus, Trash2, Save, ArrowLeft } from 'lucide-react'

export default function QuestionBankPage({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [phase, setPhase] = useState('Fase D')
  const [priceInTokens, setPriceInTokens] = useState(0)
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const [aiTopic, setAiTopic] = useState('')
  const [aiCount, setAiCount] = useState(3)
  const [aiType, setAiType] = useState('multiple_choice')
  const [aiCognitive, setAiCognitive] = useState('C4')
  const [generating, setGenerating] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL

  const [questions, setQuestions] = useState([
    {
      question_text: '',
      question_type: 'multiple_choice',
      options: { a: '', b: '', c: '', d: '' },
      correct_answer: 'a',
      explanation: '',
      cognitive_level: 'C2'
    }
  ])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        options: { a: '', b: '', c: '', d: '' },
        correct_answer: 'a',
        explanation: '',
        cognitive_level: 'C2'
      }
    ])
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated)
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated: any = [...questions]
    updated[index][field] = value
    setQuestions(updated)
  }

  const handleAIGenerate = async () => {
    if (!aiTopic) {
      alert('Mohon masukkan topik materi terlebih dahulu untuk AI.')
      return
    }

    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesi login berakhir.')

      const response = await axios.post(
        `${API_URL}/api/ai/generate-questions`,
        {
          topic: aiTopic,
          question_type: aiType,
          number_of_q: Number(aiCount),
          cognitive_level: aiCognitive
        },
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      )

      if (Array.isArray(response.data) && response.data.length > 0) {
        setQuestions(response.data)
        alert('Berhasil men-generate soal dengan AI!')
      } else {
        alert('Format respons AI tidak valid.')
      }
    } catch (err: any) {
      alert('Gagal generate AI: ' + (err.response?.data?.error || err.message))
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createQuestionBank({
        title,
        description,
        subject,
        phase,
        price_in_tokens: Number(priceInTokens),
        is_public: isPublic,
        questions
      })
      alert('Bank soal berhasil dibuat dan disimpan!')
      onBack()
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-tp-bg p-4 sm:p-8">
      <div className="mx-auto max-w-8xl space-y-6">
        
        {/* Tombol Kembali / Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-tp-text">Buat Bank Soal & Asesmen</h1>
            <p className="text-sm text-tp-muted">Susun paket ujian mandiri atau manfaatkan Asisten AI.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl gap-2 border-tp-border bg-white text-tp-text hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Kembali
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card Informasi Paket Soal */}
          <Card className="rounded-2xl border-tp-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Paket Soal</CardTitle>
              <CardDescription>Atur detail dasar, mata pelajaran, dan opsi monetisasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Judul Paket Ujian / Modul</Label>
                <Input 
                  id="title" 
                  placeholder="Contoh: Penilaian Harian Sistem Pencernaan Manusia" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="subject">Mata Pelajaran</Label>
                  <Input 
                    id="subject" 
                    placeholder="IPA / Matematika" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="phase">Fase / Kelas</Label>
                  <Input 
                    id="phase" 
                    placeholder="Fase D / Kelas 8" 
                    value={phase} 
                    onChange={(e) => setPhase(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="description">Deskripsi Singkat</Label>
                <textarea 
                  id="description"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-tp-text outline-none transition focus:border-tp-green focus:shadow-[0_0_0_3px_rgba(15,76,54,0.12)]"
                  placeholder="Keterangan tambahan untuk ujian ini..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={2} 
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-tp-text">
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-tp-green focus:ring-tp-green" 
                  />
                  Bagikan ke Marketplace Bank Soal (Jual ke Guru Lain)
                </label>

                {isPublic && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="price" className="text-xs font-semibold">Harga Token:</Label>
                    <Input 
                      id="price"
                      type="number" 
                      value={priceInTokens} 
                      onChange={(e) => setPriceInTokens(Number(e.target.value))} 
                      min={0} 
                      className="w-24 h-9" 
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card Panel Generator AI */}
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                <Sparkles size={18} className="text-emerald-600" /> Asisten Generator Soal (AI)
              </CardTitle>
              <CardDescription className="text-emerald-700/80">Buat soal otomatis secara instan berdasarkan topik materi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="aiTopic" className="text-emerald-900">Topik / Materi Pembelajaran</Label>
                <Input 
                  id="aiTopic" 
                  className="bg-white border-emerald-200 focus:border-emerald-600"
                  placeholder="Contoh: Enzim pencernaan lambung dan fungsinya" 
                  value={aiTopic} 
                  onChange={(e) => setAiTopic(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-emerald-900">Jumlah Soal</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={aiCount} 
                    onChange={(e) => setAiCount(Number(e.target.value))} 
                    className="bg-white border-emerald-200"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-emerald-900">Tipe Soal</Label>
                  <select 
                    value={aiType} 
                    onChange={(e) => setAiType(e.target.value)} 
                    className="w-full h-10 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-tp-text outline-none focus:border-emerald-600"
                  >
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="essay">Essay / Uraian</option>
                    <option value="short_answer">Isian Singkat</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-emerald-900">Level Kognitif</Label>
                  <select 
                    value={aiCognitive} 
                    onChange={(e) => setAiCognitive(e.target.value)} 
                    className="w-full h-10 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-tp-text outline-none focus:border-emerald-600"
                  >
                    <option value="C2">C2 - Memahami</option>
                    <option value="C3">C3 - Penerapan</option>
                    <option value="C4">C4 - Analisis (HOTS)</option>
                  </select>
                </div>
              </div>

              <Button 
                type="button" 
                onClick={handleAIGenerate} 
                disabled={generating} 
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl gap-2 mt-2"
              >
                <Sparkles size={16} />
                {generating ? 'AI sedang meracik soal...' : 'Buat Soal Otomatis dengan AI'}
              </Button>
            </CardContent>
          </Card>

          {/* Daftar Butir Soal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-tp-text">Daftar Butir Soal ({questions.length})</h3>
              <Button 
                type="button" 
                onClick={addQuestion} 
                size="sm"
                className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl gap-1.5 text-xs"
              >
                <Plus size={14} /> Tambah Soal
              </Button>
            </div>

            {questions.map((q, idx) => (
              <Card key={idx} className="rounded-2xl border-tp-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-bold text-tp-muted">Soal No. {idx + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button 
                      type="button" 
                      variant="destructive"
                      size="sm"
                      onClick={() => removeQuestion(idx)} 
                      className="h-8 px-2.5 text-xs rounded-xl gap-1"
                    >
                      <Trash2 size={12} /> Hapus
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Tipe Soal</Label>
                      <select 
                        value={q.question_type} 
                        onChange={(e) => handleQuestionChange(idx, 'question_type', e.target.value)} 
                        className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-tp-text outline-none focus:border-tp-green"
                      >
                        <option value="multiple_choice">Pilihan Ganda (PG)</option>
                        <option value="complex_multiple_choice">Pilihan Ganda Kompleks</option>
                        <option value="matching">Menjodohkan</option>
                        <option value="true_false">Benar / Salah</option>
                        <option value="short_answer">Isian Singkat</option>
                        <option value="essay">Uraian / Essay</option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Level Kognitif</Label>
                      <select 
                        value={q.cognitive_level} 
                        onChange={(e) => handleQuestionChange(idx, 'cognitive_level', e.target.value)} 
                        className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-tp-text outline-none focus:border-tp-green"
                      >
                        <option value="C1">C1 - Mengingat</option>
                        <option value="C2">C2 - Memahami</option>
                        <option value="C3">C3 - Penerapan</option>
                        <option value="C4">C4 - Analisis (HOTS)</option>
                        <option value="C5">C5 - Evaluasi (HOTS)</option>
                        <option value="C6">C6 - Kreasi (HOTS)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Pertanyaan / Wacana / Stimulus</Label>
                    <textarea 
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-tp-text outline-none transition focus:border-tp-green"
                      placeholder="Tuliskan teks soal di sini..." 
                      value={q.question_text} 
                      onChange={(e) => handleQuestionChange(idx, 'question_text', e.target.value)} 
                      rows={3} 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Kunci Jawaban</Label>
                      <Input 
                        placeholder="Contoh: A atau [A, C]" 
                        value={q.correct_answer} 
                        onChange={(e) => handleQuestionChange(idx, 'correct_answer', e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Pembahasan Soal</Label>
                      <Input 
                        placeholder="Penjelasan mengapa jawaban tersebut benar..." 
                        value={q.explanation} 
                        onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-tp-green hover:bg-tp-green-hover text-white font-semibold py-3 rounded-xl gap-2 text-base"
          >
            <Save size={18} />
            {loading ? 'Menyimpan...' : 'Simpan Bank Soal Permanen'}
          </Button>

        </form>
      </div>
    </div>
  )
}