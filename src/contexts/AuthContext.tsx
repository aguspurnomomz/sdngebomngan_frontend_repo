import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/axios'
import { supabase } from '../lib/supabaseClient'

export type Position = {
  role_id: string
  code: string
  label: string
  scope_type: 'global' | 'school' | 'class'
  class_sub_group_id?: string
  class_sub_group_name?: string
  permissions: string[]
}

type AuthState = {
  permissions: Set<string>
  positions: Position[]
  role: string | null
  loading: boolean
  hasPermission: (code: string) => boolean
  hasAny: (codes: string[]) => boolean
  hasPosition: (code: string) => boolean
  getPosition: (code: string) => Position | undefined
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [positions, setPositions] = useState<Position[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAuth = async () => {
    try {
      const res = await api.get('/api/auth/check-role')
      const perms = new Set<string>(res.data.permissions || [])
      setPermissions(perms)
      setPositions(res.data.positions || [])
      setRole(res.data.role || null)
    } catch (e) {
      console.error('[Auth] Gagal load permissions:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setPermissions(new Set())
        setPositions([])
        setRole(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      permissions,
      positions,
      role,
      loading,
      hasPermission: (code) => permissions.has(code),
      hasAny: (codes) => codes.some(c => permissions.has(c)),
      hasPosition: (code) => positions.some(p => p.code === code),
      getPosition: (code) => positions.find(p => p.code === code),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}