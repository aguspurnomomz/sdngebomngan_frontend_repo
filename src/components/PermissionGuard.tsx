import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Props = {
  permission?: string
  anyOf?: string[]
  position?: string
  fallback?: string
  children: React.ReactNode
}

export function PermissionGuard({ permission, anyOf, position, fallback = '/', children }: Props) {
  const { hasPermission, hasAny, hasPosition, loading } = useAuth()

  if (loading) {
    return <div className="grid min-h-screen place-items-center">Memverifikasi akses...</div>
  }

  if (position && !hasPosition(position)) {
    return <Navigate to={fallback} replace />
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to={fallback} replace />
  }
  if (anyOf && !hasAny(anyOf)) {
    return <Navigate to={fallback} replace />
  }
  return <>{children}</>
}