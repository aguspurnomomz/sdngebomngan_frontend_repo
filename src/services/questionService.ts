import { supabase } from '../lib/supabaseClient'

const BACKEND_URL = 'http://localhost:8080/api'

export async function createQuestionBank(data: any) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi kedaluwarsa, silakan login ulang.')

  const response = await fetch(`${BACKEND_URL}/question-banks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(data)
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error || 'Gagal menyimpan bank soal')
  }

  return result
}