import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import { roomMembers, roomPendingRequests, rooms } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { attachProfile, requireAdmin, requireApproved } from '../middleware/roles'
import { messagesRouter } from './messages'
import { notify } from './notifications'

export const roomsRouter = Router()
roomsRouter.use(requireAuth, attachProfile)
roomsRouter.use('/:roomId/messages', messagesRouter)

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

async function serializeRooms() {
  const [allRooms, allMembers, allPending] = await Promise.all([
    db.select().from(rooms),
    db.select().from(roomMembers),
    db.select().from(roomPendingRequests),
  ])
  return allRooms.map((room) => ({
    ...room,
    memberIds: allMembers.filter((m) => m.roomId === room.id).map((m) => m.userId),
    pendingRequestIds: allPending.filter((p) => p.roomId === room.id).map((p) => p.userId),
  }))
}

roomsRouter.get('/', async (_req, res) => {
  res.json(await serializeRooms())
})

roomsRouter.post('/', requireAdmin, async (req, res) => {
  const { name, description, bannerUrl } = req.body as { name: string; description: string; bannerUrl?: string }
  const id = crypto.randomUUID()
  await db.insert(rooms).values({
    id,
    name,
    description: description ?? '',
    bannerUrl: bannerUrl ?? '',
    inviteCode: generateInviteCode(),
    ownerId: req.uid!,
    createdAt: Date.now(),
  })
  await db.insert(roomMembers).values({ roomId: id, userId: req.uid! })
  res.status(201).json((await serializeRooms()).find((r) => r.id === id))
})

roomsRouter.post('/join-by-code', requireApproved, async (req, res) => {
  const { code } = req.body as { code: string }
  const [room] = await db.select().from(rooms).where(eq(rooms.inviteCode, code.trim().toUpperCase())).limit(1)
  if (!room) {
    res.status(404).json({ error: 'Invalid invite code.' })
    return
  }
  const [existing] = await db
    .select()
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, req.uid!)))
    .limit(1)
  if (existing) {
    res.status(409).json({ error: 'You are already a member of this room.' })
    return
  }
  await db.insert(roomMembers).values({ roomId: room.id, userId: req.uid! })
  res.json(room)
})

roomsRouter.post('/:id/request-join', requireApproved, async (req, res) => {
  const roomId = req.params.id as string
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1)
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  await db
    .insert(roomPendingRequests)
    .values({ roomId, userId: req.uid! })
    .onConflictDoNothing()
  await notify(room.ownerId, {
    type: 'room_joined',
    title: 'New join request',
    message: `Someone requested to join ${room.name}.`,
    link: `/rooms/${roomId}`,
  })
  res.status(204).end()
})

roomsRouter.post('/:id/approve/:uid', async (req, res) => {
  const roomId = req.params.id as string
  const targetUid = req.params.uid as string
  const room = (await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1))[0]
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (req.profile!.role !== 'admin' && req.profile!.id !== room.ownerId) {
    res.status(403).json({ error: 'Only the room owner or an admin can approve requests' })
    return
  }
  await db.insert(roomMembers).values({ roomId: room.id, userId: targetUid }).onConflictDoNothing()
  await db
    .delete(roomPendingRequests)
    .where(and(eq(roomPendingRequests.roomId, room.id), eq(roomPendingRequests.userId, targetUid)))
  await notify(targetUid, {
    type: 'room_joined',
    title: 'Request approved',
    message: `You've joined ${room.name}!`,
    link: `/rooms/${room.id}`,
  })
  res.status(204).end()
})

roomsRouter.post('/:id/reject/:uid', async (req, res) => {
  const roomId = req.params.id as string
  const targetUid = req.params.uid as string
  const room = (await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1))[0]
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (req.profile!.role !== 'admin' && req.profile!.id !== room.ownerId) {
    res.status(403).json({ error: 'Only the room owner or an admin can reject requests' })
    return
  }
  await db
    .delete(roomPendingRequests)
    .where(and(eq(roomPendingRequests.roomId, room.id), eq(roomPendingRequests.userId, targetUid)))
  res.status(204).end()
})
