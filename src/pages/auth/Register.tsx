import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthShell } from '@/components/layout/AuthShell'
import { AvatarPicker } from '@/components/shared/AvatarPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { dicebearAvatar, uploadAvatar } from '@/lib/storage'

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    username: z
      .string()
      .min(3, 'At least 3 characters')
      .max(20, 'Max 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().optional(),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(dicebearAvatar('player'))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const username = watch('username')

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(values.username, avatarFile)
      }
      await registerUser({
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        phone: values.phone,
        password: values.password,
        avatarUrl: finalAvatarUrl,
      })
      toast.success('Account created! Check your email to verify it.')
      navigate('/verify-email')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Join the arena 🏆" subtitle="Create your player profile to request access.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AvatarPicker
          seedBase={username}
          value={avatarUrl}
          onChange={setAvatarUrl}
          onFileSelected={setAvatarFile}
        />

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Alex Rivera" {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="alex_r" {...register('username')} />
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@email.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number (optional)</Label>
          <Input id="phone" type="tel" placeholder="+1 555 123 4567" {...register('phone')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a member?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
