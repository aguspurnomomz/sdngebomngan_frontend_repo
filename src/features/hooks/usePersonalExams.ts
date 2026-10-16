import { useCallback, useEffect, useState } from 'react'
import { personalExamApi } from '../../features/personal-exam/api'
import type { PersonalExam } from '../../features/personal-exam/types'
import { useAuthToken } from '@/features/hooks/useAuthToken'

type Filters = {
  status?: string
  subject?: string
  search?: string
  exam_type?: string
}

export function usePersonalExams(initialFilters?: Filters) {
  const { token } = useAuthToken()
  const [exams, setExams] = useState<PersonalExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters || {})

  const fetchExams = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const data = await personalExamApi.list(token, filters)
      setExams(data.exams || [])
    } catch (e: any) {
      console.error('Gagal memuat personal exams:', e)
      setError(e.response?.data?.error || e.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [token, filters])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  return {
    exams,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchExams,
  }
}