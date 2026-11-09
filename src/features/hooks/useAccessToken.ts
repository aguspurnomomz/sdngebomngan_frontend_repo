import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

/**
 * Mengambil access token Supabase secara reaktif.
 * Token otomatis di-refresh ketika sesi berubah (SIGNED_IN / TOKEN_REFRESHED).
 */
export function useAccessToken() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Ambil token awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setToken(session?.access_token || '')
      setLoading(false)
    })

    // Dengarkan perubahan sesi (login, refresh token, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setToken(session?.access_token || '')
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { token, loading }
}