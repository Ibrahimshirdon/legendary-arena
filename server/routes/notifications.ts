import crypto from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import { notifications, pushSubscriptions } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { sendPushToUser } from '../push'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth)

interface NotifyInput {
  type: string
  title: string
  message: string
  link?: string
}

export async function notify(userId: string, input: NotifyInput) {
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link ?? '',
    read: false,
    createdAt: Date.now(),
  })
  // Fire-and-forget: a push failure (expired subscription, no device
  // registered, etc.) should never break the action that triggered it.
  void sendPushToUser(userId, { title: input.title, body: input.message, url: input.link }).catch(() => {})
}

export async function notifyMany(userIds: string[], input: NotifyInput) {
  await Promise.all(userIds.map((userId) => notify(userId, input)))
}

notificationsRouter.get('/', async (req, res) => {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, req.uid!))
    .orderBy(desc(notifications.createdAt))
    .limit(200)
  res.json(rows)
})

notificationsRouter.patch('/:id/read', async (req, res) => {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.uid!)))
  res.status(204).end()
})

notificationsRouter.patch('/mark-all-read', async (req, res) => {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, req.uid!), eq(notifications.read, false)))
  res.status(204).end()
})

notificationsRouter.post('/push/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } }
  await db
    .insert(pushSubscriptions)
    .values({ id: crypto.randomUUID(), userId: req.uid!, endpoint, p256dh: keys.p256dh, auth: keys.auth, createdAt: Date.now() })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: req.uid!, p256dh: keys.p256dh, auth: keys.auth },
    })
  res.status(204).end()
})

notificationsRouter.post('/push/unsubscribe', async (req, res) => {
  const { endpoint } = req.body as { endpoint: string }
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
  res.status(204).end()
})
