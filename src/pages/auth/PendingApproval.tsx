import { Clock, LogOut, ShieldX } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

export default function PendingApproval() {
  const { profile, logout, loading } = useAuth()

  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.status === 'approved') return <Navigate to="/" replace />

  const banned = profile.status === 'banned' || profile.status === 'rejected'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background pitch-pattern px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div
          className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
            banned ? 'bg-destructive/15 text-destructive' : 'bg-secondary/15 text-secondary'
          }`}
        >
          {banned ? <ShieldX className="size-6" /> : <Clock className="size-6" />}
        </div>
        <h1 className="mt-4 text-lg font-bold">
          {banned ? 'Access restricted' : 'Waiting for admin approval'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {banned
            ? 'Your account access has been restricted by an admin. Contact your community admin for more information.'
            : "You're almost in. An admin needs to approve your account before you can enter the arena. You'll be let in automatically once approved."}
        </p>
        <Button variant="outline" className="mt-6 w-full" onClick={() => void logout()}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  )
}
