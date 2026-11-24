import crypto from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import { notifications } from '../db/schema'
import { requireAuth } from '../middleware/auth'

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
