import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!firebaseUser) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />

  if (profile.status === 'unverified') return <Navigate to="/verify-email" replace />

  if (profile.status === 'rejected' || profile.status === 'banned') {
    return <Navigate to="/pending" replace />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
