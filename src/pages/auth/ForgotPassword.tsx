import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormValues = z.infer<typeof schema>

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await resetPassword(values.email)
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure link to reset it.">
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
          <MailCheck className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Check your inbox for a password reset link. It may take a minute to arrive.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@email.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
