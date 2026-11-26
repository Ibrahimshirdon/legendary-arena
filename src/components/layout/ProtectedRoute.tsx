import { Loader2, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, authLoading, profileLoading, profileError, refreshProfile } = useAuth()

  // Firebase hasn't told us yet whether a session exists — never redirect
  // during this window, or a valid session would get bounced to /login.
  if (authLoading) return <FullScreenSpinner />

  // Firebase has confirmed there's no signed-in user. This is the ONLY
  // condition that sends someone to /login from here.
  if (!firebaseUser) return <Navigate to="/login" replace />

  if (!profile) {
    // Signed in, but the profile hasn't loaded yet — still trying, or the
    // backend is temporarily unreachable (cold start, network blip, 5xx).
    // Never treat this as "logged out"; show a retry state instead.
    if (profileLoading) return <FullScreenSpinner />
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <WifiOff className="size-8 text-muted-foreground" />
        <div>
          <p className="font-semibold">Couldn't reach the server</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {profileError ?? 'The backend may be waking up — this can take up to a minute.'} You're still signed
            in; this will recover automatically, or you can retry now.
          </p>
        </div>
        <Button onClick={() => void refreshProfile()}>Retry</Button>
      </div>
    )
  }

  if (profile.status === 'unverified') return <Navigate to="/verify-email" replace />

  if (profile.status === 'rejected' || profile.status === 'banned') {
    return <Navigate to="/pending" replace />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, authLoading } = useAuth()
  if (authLoading) return null
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
