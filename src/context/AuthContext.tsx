import {
  browserLocalPersistence,
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
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
  /** True only until Firebase's very first onAuthStateChanged callback fires. */
  authLoading: boolean
  /** True while a profile fetch is in flight (initial load or background refresh). */
  profileLoading: boolean
  /** Message from the most recent failed profile fetch, if the last attempt failed. Not cleared by a successful background refresh of something else — only by the next fetch attempt. */
  profileError: string | null
  /** Convenience flag for a full-screen spinner: true only while we have nothing to show yet. */
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

function describeError(err: unknown) {
  return err instanceof Error ? err.message : 'Could not load your profile.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  /**
   * Fetches the profile. On failure, this NEVER clears an already-loaded
   * profile and NEVER signs the user out for network errors, timeouts, or
   * 5xx/502/503 responses (Render cold starts, DB hiccups, etc.) — it just
   * records the error so the UI can show a retry state while keeping the
   * Firebase session intact.
   *
   * The one exception: a 401 means our backend rejected the ID token. Even
   * then we don't assume the session is dead — we force-refresh the Firebase
   * token first. Only if Firebase ITSELF then reports the credential invalid
   * (a thrown auth error, not just our backend's opinion) do we sign out.
   * If the refresh succeeds but the backend still 401s, we treat that as a
   * backend-side problem, not a credential problem, and keep the session.
   */
  async function refreshProfile() {
    if (!auth.currentUser) return
    setProfileLoading(true)
    try {
      const current = await api.get<UserProfile>('/users/me')
      setProfile(current)
      setProfileError(null)
      return
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const currentUser = auth.currentUser
        try {
          await currentUser?.getIdToken(true)
        } catch {
          // Firebase itself confirms the credential is invalid/expired beyond
          // recovery — a legitimate, Firebase-confirmed reason to end the session.
          await signOut(auth).catch(() => {})
          return
        }
        try {
          const retried = await api.get<UserProfile>('/users/me')
          setProfile(retried)
          setProfileError(null)
          return
        } catch (retryErr) {
          setProfileError(describeError(retryErr))
          return
        }
      }
      setProfileError(describeError(err))
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    // Explicit on purpose, even though it's the SDK's web default: persists
    // the session in IndexedDB so it survives refreshes, tab closes, and
    // browser restarts. Subscribing only after this settles means we never
    // treat "persistence not configured yet" as "logged out".
    setPersistence(auth, browserLocalPersistence)
      .catch(() => {})
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user)
          setAuthLoading(false)
          if (!user) {
            setProfile(null)
            setProfileError(null)
          }
        })
      })
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    if (!firebaseUser) return
    void refreshProfile()
    // No realtime push from the API, so poll for role/status changes (e.g. an
    // admin promoting/banning this account) while signed in. A failed poll
    // just leaves profile/profileError as-is — see refreshProfile above.
    const interval = setInterval(() => void refreshProfile(), 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    await setPersistence(auth, browserLocalPersistence).catch(() => {})
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
    // Must complete before sign-in is considered done, so the session is
    // guaranteed to persist even if the tab is closed immediately after.
    await setPersistence(auth, browserLocalPersistence)
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await api.patch('/users/me', { online: false }).catch(() => {})
    await signOut(auth)
    toast.success("You've been signed out.")
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
      authLoading,
      profileLoading,
      profileError,
      // Full-screen spinner only while we have nothing to show yet: either
      // Firebase hasn't told us whether we're signed in, or we are signed in
      // and are still waiting on the very first profile fetch to settle.
      loading: authLoading || (Boolean(firebaseUser) && profileLoading && !profile),
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
    [firebaseUser, profile, authLoading, profileLoading, profileError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
