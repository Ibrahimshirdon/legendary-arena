import crypto from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import { messageReactions, messages, roomMembers } from '../db/schema'
import { requireApproved } from '../middleware/roles'
import { notify } from './notifications'

export const messagesRouter = Router({ mergeParams: true })

async function serializeMessages(roomId: string) {
  const [rows, reactions] = await Promise.all([
    db.select().from(messages).where(eq(messages.roomId, roomId)).orderBy(asc(messages.createdAt)).limit(200),
    db.select().from(messageReactions),
  ])
  return rows.map((m) => {
    const reactionMap: Record<string, string[]> = {}
    for (const r of reactions) {
      if (r.messageId !== m.id) continue
      reactionMap[r.emoji] = [...(reactionMap[r.emoji] ?? []), r.userId]
    }
    return { ...m, reactions: reactionMap }
  })
}

messagesRouter.get('/', async (req, res) => {
  const roomId = (req.params as Record<string, string>).roomId
  res.json(await serializeMessages(roomId))
})

messagesRouter.post('/', requireApproved, async (req, res) => {
  const roomId = (req.params as Record<string, string>).roomId
  const { text, imageUrl, isAnnouncement, replyToId } = req.body as {
    text: string
    imageUrl?: string | null
    isAnnouncement?: boolean
    replyToId?: string | null
  }
  if (!text.trim() && !imageUrl) {
    res.status(400).json({ error: 'Message needs text or an image' })
    return
  }
  if (isAnnouncement && req.profile!.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can send announcements' })
    return
  }
  const id = crypto.randomUUID()
  await db.insert(messages).values({
    id,
    roomId,
    senderId: req.uid!,
    text,
    imageUrl: imageUrl ?? null,
    replyToId: replyToId ?? null,
    isAnnouncement: Boolean(isAnnouncement),
    deleted: false,
    createdAt: Date.now(),
  })

  const members = await db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId))
  const preview = isAnnouncement
    ? `📢 ${text}`
    : imageUrl && !text.trim()
      ? '📷 Photo'
      : text.length > 120
        ? `${text.slice(0, 117)}...`
        : text
  await Promise.all(
    members
      .filter((m) => m.userId !== req.uid)
      .map((m) =>
        notify(m.userId, {
          type: 'chat_message',
          title: req.profile!.username,
          message: preview,
          link: `/rooms/${roomId}?tab=chat`,
        }),
      ),
  )

  res.status(201).json((await serializeMessages(roomId)).find((m) => m.id === id))
})

messagesRouter.patch('/:messageId/delete', async (req, res) => {
  const messageId = req.params.messageId as string
  const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1)
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  if (message.senderId !== req.uid && req.profile!.role !== 'admin') {
    res.status(403).json({ error: 'Not allowed' })
    return
  }
  await db.update(messages).set({ deleted: true, text: '', imageUrl: null }).where(eq(messages.id, messageId))
  res.status(204).end()
})

// One reaction per user per message — picking a new emoji swaps out
// whichever one they already had; picking the same one again removes it.
messagesRouter.post('/:messageId/reactions', requireApproved, async (req, res) => {
  const messageId = req.params.messageId as string
  const { emoji } = req.body as { emoji: string }
  const existing = await db
    .select()
    .from(messageReactions)
    .where(and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, req.uid!)))

  await db
    .delete(messageReactions)
    .where(and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, req.uid!)))

  const alreadyHadThisEmoji = existing.some((r) => r.emoji === emoji)
  if (!alreadyHadThisEmoji) {
    await db.insert(messageReactions).values({ messageId, emoji, userId: req.uid! })
  }
  res.status(204).end()
})
