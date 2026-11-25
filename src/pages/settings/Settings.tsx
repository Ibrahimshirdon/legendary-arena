import { updatePassword } from 'firebase/auth'
import { Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '@/components/layout/Topbar'
import { AvatarPicker } from '@/components/shared/AvatarPicker'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import { uploadAvatar } from '@/lib/storage'

export default function Settings() {
  const { profile, firebaseUser, refreshProfile, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [favoriteTeam, setFavoriteTeam] = useState(profile?.favoriteTeam ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  if (!profile || !firebaseUser) return null
  const uid = profile.uid
  const currentUser = firebaseUser

  async function handleSaveProfile() {
    setSaving(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(uid, avatarFile)
      }
      await api.patch('/users/me', {
        fullName,
        phone,
        favoriteTeam,
        bio,
        avatarUrl: finalAvatarUrl,
      })
      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    setChangingPassword(true)
    try {
      await updatePassword(currentUser, newPassword)
      toast.success('Password updated!')
      setNewPassword('')
    } catch {
      toast.error('Could not update password. Please sign out and sign back in, then try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Your account has been deleted.')
      navigate('/login')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete your account.')
      setDeleting(false)
    }
  }

  return (
    <div>
      <Topbar title="Settings" subtitle="Manage your profile and account." />
      <div className="max-w-2xl space-y-6 p-4 lg:p-8">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold">Profile</h3>
          <AvatarPicker seedBase={profile.username} value={avatarUrl} onChange={setAvatarUrl} onFileSelected={setAvatarFile} />

          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={profile.username} disabled />
            <p className="text-xs text-muted-foreground">Usernames can't be changed yet.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number (optional)</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="favoriteTeam">Favorite team (optional)</Label>
            <Input id="favoriteTeam" value={favoriteTeam} onChange={(e) => setFavoriteTeam(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio…" />
          </div>

          <Button onClick={() => void handleSaveProfile()} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold">Security</h3>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button variant="outline" onClick={() => void handleChangePassword()} disabled={changingPassword}>
            {changingPassword && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="font-bold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Permanently deletes your account. You'll be signed out and can never log back in with it. Your match
            history, trophies, and chat messages stay (attributed to "Deleted User") since they're shared with
            other players — only your personal info and login are removed.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete My Account
          </Button>
        </section>
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete your account?"
        description="This cannot be undone. You will be signed out immediately and will not be able to log back in."
        confirmLabel={deleting ? 'Deleting…' : 'Delete My Account'}
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
