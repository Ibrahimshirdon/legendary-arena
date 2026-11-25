import crypto from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import { bootstrap, roomMembers, roomPendingRequests, tournamentRegistrations, users } from '../db/schema'
import { adminAuth } from '../firebaseAdmin'
import { requireAuth } from '../middleware/auth'
import { attachProfile, requireAdmin } from '../middleware/roles'
import { notify } from './notifications'

export const usersRouter = Router()

// Public: checked before the Firebase account (and its login token) exists yet.
usersRouter.get('/check-username/:username', async (req, res) => {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.usernameLower, req.params.username.toLowerCase()))
    .limit(1)
  res.json({ taken: Boolean(existing) })
})

// Public: lets the login screen accept a username instead of an email.
// Firebase Auth only signs in by email, so we resolve the username to its
// account email first, client-side, before calling signInWithEmailAndPassword.
usersRouter.get('/resolve-login/:identifier', async (req, res) => {
  const identifier = req.params.identifier as string
  if (identifier.includes('@')) {
    res.json({ email: identifier })
    return
  }
  const [existing] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.usernameLower, identifier.toLowerCase()))
    .limit(1)
  if (!existing) {
    res.status(404).json({ error: 'No account found with that username.' })
    return
  }
  res.json({ email: existing.email })
})

usersRouter.use(requireAuth)

type UserRow = typeof users.$inferSelect

// The DB row uses `id` and flat stat columns; the frontend's UserProfile type
// (unchanged from the Firestore version) expects `uid` and a nested `stats` object.
export function serializeUser(row: UserRow) {
  return {
    uid: row.id,
    username: row.username,
    usernameLower: row.usernameLower,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatarUrl,
    role: row.role,
    status: row.status,
    favoriteTeam: row.favoriteTeam ?? undefined,
    bio: row.bio ?? undefined,
    online: row.online,
    lastSeen: row.lastSeen,
    createdAt: row.createdAt,
    stats: {
      tournamentsPlayed: row.tournamentsPlayed,
      matchesPlayed: row.matchesPlayed,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      points: row.points,
      trophies: row.trophies,
      runnerUps: row.runnerUps,
      thirdPlaces: row.thirdPlaces,
    },
  }
}

// Create the profile row right after Firebase sign-up.
usersRouter.post('/', async (req, res) => {
  const { fullName, username, avatarUrl, email, phone } = req.body as {
    fullName: string
    username: string
    avatarUrl: string
    email: string
    phone?: string
  }
  if (!fullName || !username || !email) {
    res.status(400).json({ error: 'fullName, username, and email are required' })
    return
  }

  const usernameLower = username.toLowerCase()
  const [existing] = await db.select().from(users).where(eq(users.usernameLower, usernameLower)).limit(1)
  if (existing) {
    res.status(409).json({ error: 'That username is already taken.' })
    return
  }

  // Atomically claim the one-time bootstrap admin slot, if still unclaimed.
  const claimed = await db
    .update(bootstrap)
    .set({ claimed: true })
    .where(eq(bootstrap.claimed, false))
    .returning()
  const isFirstUser = claimed.length > 0

  const [profile] = await db
    .insert(users)
    .values({
      id: req.uid!,
      username,
      usernameLower,
      fullName,
      email,
      phone: phone || null,
      avatarUrl: avatarUrl ?? '',
      role: isFirstUser ? 'admin' : 'member',
      status: 'unverified',
      online: true,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    })
    .returning()

  res.status(201).json(serializeUser(profile))
})

usersRouter.get('/me', attachProfile, async (req, res) => {
  if (!req.profile) {
    res.status(404).json({ error: 'No profile yet' })
    return
  }
  res.json(serializeUser(req.profile))
})

usersRouter.get('/', async (_req, res) => {
  const all = await db.select().from(users)
  res.json(all.map(serializeUser))
})

// Called once the user has clicked the verification link in their email.
// `req.emailVerified` reflects the Firebase ID token's own `email_verified`
// claim — the client must force-refresh its token (after reload()) before
// calling this, otherwise the claim will still be stale/false.
usersRouter.post('/confirm-email-verified', attachProfile, async (req, res) => {
  if (!req.profile) {
    res.status(404).json({ error: 'No profile yet' })
    return
  }
  if (!req.emailVerified) {
    res.status(400).json({ error: 'Email not verified yet. Please click the link in your email first.' })
    return
  }
  if (req.profile.status !== 'unverified') {
    res.json(serializeUser(req.profile))
    return
  }
  const newStatus = req.profile.role === 'admin' ? 'approved' : 'pending'
  const [updated] = await db.update(users).set({ status: newStatus }).where(eq(users.id, req.profile.id)).returning()
  res.json(serializeUser(updated))
})

// Self-service profile edits: fullName, favoriteTeam, bio, avatarUrl, presence. Never role/status.
usersRouter.patch('/me', attachProfile, async (req, res) => {
  if (!req.profile) {
    res.status(404).json({ error: 'No profile yet' })
    return
  }
  const { fullName, favoriteTeam, bio, avatarUrl, online, phone } = req.body as Record<string, unknown>
  const [updated] = await db
    .update(users)
    .set({
      ...(fullName !== undefined ? { fullName: fullName as string } : {}),
      ...(favoriteTeam !== undefined ? { favoriteTeam: favoriteTeam as string } : {}),
      ...(bio !== undefined ? { bio: bio as string } : {}),
      ...(phone !== undefined ? { phone: phone as string } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl as string } : {}),
      ...(online !== undefined ? { online: online as boolean } : {}),
      lastSeen: Date.now(),
    })
    .where(eq(users.id, req.profile.id))
    .returning()
  res.json(serializeUser(updated))
})

// Self-service account deletion. This doesn't hard-delete the row: a user's
// matches, trophies, and chat messages are also part of *other* players'
// shared history (opponents, teammates, standings), so wiping them would
// corrupt everyone else's records. Instead we scrub personal info, drop
// current memberships/registrations, and remove the Firebase Auth account
// so they can never log back in — matches/trophies/chat stay, attributed to
// "Deleted User".
usersRouter.delete('/me', attachProfile, async (req, res) => {
  if (!req.profile) {
    res.status(404).json({ error: 'No profile yet' })
    return
  }
  const uid = req.profile.id

  if (req.profile.role === 'admin') {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'))
    if (admins.length <= 1) {
      res.status(400).json({
        error: 'You are the only admin. Promote another member to admin before deleting your account.',
      })
      return
    }
  }

  await db.delete(roomMembers).where(eq(roomMembers.userId, uid))
  await db.delete(roomPendingRequests).where(eq(roomPendingRequests.userId, uid))
  await db.delete(tournamentRegistrations).where(eq(tournamentRegistrations.userId, uid))

  const anonymousTag = crypto.randomUUID().slice(0, 8)
  await db
    .update(users)
    .set({
      username: `deleted_${anonymousTag}`,
      usernameLower: `deleted_${anonymousTag}`,
      fullName: 'Deleted User',
      email: `deleted-${uid}@legendary-arena.invalid`,
      phone: null,
      avatarUrl: '',
      bio: null,
      favoriteTeam: null,
      role: 'member',
      status: 'banned',
      online: false,
    })
    .where(eq(users.id, uid))

  await adminAuth.deleteUser(uid).catch(() => {})

  res.status(204).end()
})

// Admin-only: approve/reject/ban members and promote/demote admins.
usersRouter.patch('/:id/status', attachProfile, requireAdmin, async (req, res) => {
  const { status } = req.body as { status: string }
  const targetId = req.params.id as string
  const [updated] = await db.update(users).set({ status }).where(eq(users.id, targetId)).returning()
  if (status === 'approved') {
    await notify(targetId, {
      type: 'accepted',
      title: "You're in!",
      message: 'Your account has been approved. Welcome to Legendary Arena.',
      link: '/',
    })
  }
  res.json(serializeUser(updated))
})

usersRouter.patch('/:id/role', attachProfile, requireAdmin, async (req, res) => {
  const { role } = req.body as { role: string }
  const targetId = req.params.id as string
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, targetId)).returning()
  res.json(serializeUser(updated))
})

export interface StatsDelta {
  tournamentsPlayed?: number
  matchesPlayed?: number
  wins?: number
  losses?: number
  draws?: number
  goalsFor?: number
  goalsAgainst?: number
  points?: number
  trophies?: number
  runnerUps?: number
  thirdPlaces?: number
}

export async function incrementUserStats(userId: string, delta: StatsDelta) {
  const hasChange = Object.values(delta).some((v) => v)
  if (!hasChange) return
  await db
    .update(users)
    .set({
      tournamentsPlayed: sql`${users.tournamentsPlayed} + ${delta.tournamentsPlayed ?? 0}`,
      matchesPlayed: sql`${users.matchesPlayed} + ${delta.matchesPlayed ?? 0}`,
      wins: sql`${users.wins} + ${delta.wins ?? 0}`,
      losses: sql`${users.losses} + ${delta.losses ?? 0}`,
      draws: sql`${users.draws} + ${delta.draws ?? 0}`,
      goalsFor: sql`${users.goalsFor} + ${delta.goalsFor ?? 0}`,
      goalsAgainst: sql`${users.goalsAgainst} + ${delta.goalsAgainst ?? 0}`,
      points: sql`${users.points} + ${delta.points ?? 0}`,
      trophies: sql`${users.trophies} + ${delta.trophies ?? 0}`,
      runnerUps: sql`${users.runnerUps} + ${delta.runnerUps ?? 0}`,
      thirdPlaces: sql`${users.thirdPlaces} + ${delta.thirdPlaces ?? 0}`,
    })
    .where(eq(users.id, userId))
}
