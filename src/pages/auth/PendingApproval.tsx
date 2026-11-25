import { LogOut, ShieldX } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

// Reached only for 'banned'/'rejected' accounts — there's no separate
// admin-approval gate; verifying your email is the only thing required to
// get in (see ProtectedRoute and VerifyEmail).
export default function PendingApproval() {
  const { profile, logout, loading } = useAuth()

  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.status !== 'banned' && profile.status !== 'rejected') return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-background pitch-pattern px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <ShieldX className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account access has been restricted by an admin. Contact your community admin for more information.
        </p>
        <Button variant="outline" className="mt-6 w-full" onClick={() => void logout()}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  )
}
