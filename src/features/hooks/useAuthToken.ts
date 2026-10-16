import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * Hook untuk ambil access token dari Supabase session.
 * Auto-refresh kalau session berubah.
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadToken = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) {
        setToken(session?.access_token || null)
        setLoading(false)
      }
    }

    loadToken()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setToken(session?.access_token || null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { token, loading }
}