import {
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { auth } from '@/lib/firebase'
import type { UserProfile } from '@/types'

interface RegisterInput {
  fullName: string
  username: string
  email: string
  phone?: string
  password: string
  avatarUrl: string
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  register: (input: RegisterInput) => Promise<void>
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isUsernameTaken: (username: string) => Promise<boolean>
  refreshProfile: () => Promise<void>
  deleteAccount: () => Promise<void>
  resendVerificationEmail: () => Promise<void>
  confirmEmailVerified: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [profileResolved, setProfileResolved] = useState(false)

  async function refreshProfile() {
    try {
      const current = await api.get<UserProfile>('/users/me')
      setProfile(current)
    } catch {
      setProfile(null)
    } finally {
      setProfileResolved(true)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setAuthResolved(true)
      if (!user) {
        setProfile(null)
        setProfileResolved(true)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!firebaseUser) return
    setProfileResolved(false)
    void refreshProfile()
    // No realtime push from the API, so poll for role/status changes
    // (e.g. an admin approving this account) while signed in.
    const interval = setInterval(() => void refreshProfile(), 10000)
    return () => clearInterval(interval)
  }, [firebaseUser])

  useEffect(() => {
    if (!firebaseUser || !profile) return
    void api.patch('/users/me', { online: true }).catch(() => {})
    const markOffline = () => {
      void api.patch('/users/me', { online: false }).catch(() => {})
    }
    window.addEventListener('beforeunload', markOffline)
    return () => {
      window.removeEventListener('beforeunload', markOffline)
      markOffline()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, Boolean(profile)])

  async function isUsernameTaken(username: string) {
    const { taken } = await api.get<{ taken: boolean }>(`/users/check-username/${encodeURIComponent(username)}`)
    return taken
  }

  async function register(input: RegisterInput) {
    const taken = await isUsernameTaken(input.username)
    if (taken) throw new Error('That username is already taken.')

    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password)
    await updateProfile(credential.user, { displayName: input.username })

    try {
      await api.post('/users', {
        fullName: input.fullName,
        username: input.username,
        email: input.email,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
      })
    } catch (err) {
      // Roll back the Firebase Auth account if profile creation failed (e.g. username race).
      await credential.user.delete().catch(() => {})
      throw err instanceof ApiError ? err : new Error('Could not create your profile.')
    }

    await sendEmailVerification(credential.user, {
      url: `${window.location.origin}/login`,
    }).catch(() => {})
  }

  async function login(identifier: string, password: string) {
    const trimmed = identifier.trim()
    const { email } = await api.get<{ email: string }>(
      `/users/resolve-login/${encodeURIComponent(trimmed)}`,
    )
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await api.patch('/users/me', { online: false }).catch(() => {})
    await signOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function deleteAccount() {
    await api.delete('/users/me')
    await signOut(auth).catch(() => {})
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) throw new Error('You need to be signed in to do that.')
    await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/login` })
  }

  /** Reloads the Firebase user, force-refreshes its ID token (so the
   * `email_verified` claim is current), then tells the backend to move the
   * account past the unverified stage. Returns whether it succeeded. */
  async function confirmEmailVerified() {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    await auth.currentUser.getIdToken(true)
    if (!auth.currentUser.emailVerified) return false
    const updated = await api.post<UserProfile>('/users/confirm-email-verified')
    setProfile(updated)
    return true
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      loading: !authResolved || !profileResolved,
      register,
      login,
      logout,
      resetPassword,
      isUsernameTaken,
      refreshProfile,
      deleteAccount,
      resendVerificationEmail,
      confirmEmailVerified,
    }),
    [firebaseUser, profile, authResolved, profileResolved],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
