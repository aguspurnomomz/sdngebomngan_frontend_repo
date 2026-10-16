import { useCallback, useEffect, useState } from 'react'
import { personalStudentApi } from '../../features/personal-exam/api'
import type { PersonalStudent } from '../../features/personal-exam/types'
import { useAuthToken } from '@/features/hooks/useAuthToken'

export function usePersonalStudents() {
  const { token } = useAuthToken()
  const [students, setStudents] = useState<PersonalStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchStudents = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const data = await personalStudentApi.list(token, {
        search: search || undefined,
        active_only: true,
      })
      setStudents(data.students || [])
    } catch (e: any) {
      console.error('Gagal memuat siswa:', e)
      setError(e.response?.data?.error || e.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [token, search])

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 300) 
    return () => clearTimeout(timer)
  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    search,
    setSearch,
    refetch: fetchStudents,
  }
}