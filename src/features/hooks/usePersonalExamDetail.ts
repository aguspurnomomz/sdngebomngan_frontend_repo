import { useCallback, useEffect, useState } from 'react'
import { personalExamApi } from '../../../src/features/personal-exam/api'
import type { PersonalExam } from '../../../src/features/personal-exam/types'
import { useAuthToken } from '@/features/hooks/useAuthToken'

export function usePersonalExamDetail(examId: string | undefined) {
  const { token } = useAuthToken()
  const [exam, setExam] = useState<PersonalExam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExam = useCallback(async () => {
    if (!token || !examId) return

    setLoading(true)
    setError(null)
    try {
      const data = await personalExamApi.get(token, examId)
      setExam(data.exam)
    } catch (e: any) {
      console.error('Gagal memuat detail exam:', e)
      setError(e.response?.data?.error || e.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [token, examId])

  useEffect(() => {
    fetchExam()
  }, [fetchExam])

  return {
    exam,
    loading,
    error,
    refetch: fetchExam,
  }
}