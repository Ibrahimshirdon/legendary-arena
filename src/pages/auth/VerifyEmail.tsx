import { Loader2, LogOut, Mail, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

export default function VerifyEmail() {
  const { profile, logout, loading, resendVerificationEmail, confirmEmailVerified } = useAuth()
  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)

  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.status !== 'unverified') return <Navigate to="/" replace />

  async function handleCheck() {
    setChecking(true)
    try {
      const verified = await confirmEmailVerified()
      if (!verified) {
        toast.error("Still not verified — make sure you've clicked the link in the email.")
      }
    } catch {
      toast.error('Could not check verification status. Try again in a moment.')
    } finally {
      setChecking(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await resendVerificationEmail()
      toast.success('Verification email sent again — check your inbox (and spam folder).')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      toast.error(
        message.includes('too-many-requests')
          ? "You've requested this too many times — wait a bit before trying again."
          : 'Could not resend the email.',
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background pitch-pattern px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Mail className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link to <span className="font-medium text-foreground">{profile.email}</span>.
          Click it, then come back here and press "I've verified".
        </p>

        <Button className="mt-6 w-full" onClick={() => void handleCheck()} disabled={checking}>
          {checking && <Loader2 className="size-4 animate-spin" />}
          I've verified my email
        </Button>
        <Button variant="outline" className="mt-2 w-full" onClick={() => void handleResend()} disabled={resending}>
          {resending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Resend email
        </Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => void logout()}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  )
}
