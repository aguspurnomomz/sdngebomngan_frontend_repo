import { useCallback, useEffect, useState } from 'react'
import { examParticipantApi } from '../../features/personal-exam/api'
import type { ExamParticipant, ParticipantsListResponse } from '../../features/personal-exam/types'
import { useAuthToken } from '@/features/hooks/useAuthToken'

export function usePersonalExamParticipants(examId: string | undefined) {
  const { token } = useAuthToken()
  const [participants, setParticipants] = useState<ExamParticipant[]>([])
  const [stats, setStats] = useState({
    total: 0,
    with_code: 0,
    without_code: 0,
    submitted: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = useCallback(async () => {
    if (!token || !examId) return

    setLoading(true)
    setError(null)
    try {
      const data: ParticipantsListResponse = await examParticipantApi.list(token, examId)
      setParticipants(data.participants || [])
      setStats({
        total: data.total,
        with_code: data.with_code,
        without_code: data.without_code,
        submitted: data.submitted,
      })
    } catch (e: any) {
      console.error('Gagal memuat peserta:', e)
      setError(e.response?.data?.error || e.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [token, examId])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  return {
    participants,
    stats,
    loading,
    error,
    refetch: fetchParticipants,
  }
}