import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import { tournamentRequests, tournaments, users } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { attachProfile, requireAdmin, requireApproved } from '../middleware/roles'
import { notify } from './notifications'

export const requestsRouter = Router()
requestsRouter.use(requireAuth, attachProfile)

requestsRouter.get('/', async (_req, res) => {
  res.json(await db.select().from(tournamentRequests))
})

requestsRouter.post('/', requireApproved, async (req, res) => {
  const body = req.body as {
    roomId: string
    name: string
    format: string
    numPlayers: number
    description: string
    proposedDate: number
    message?: string
  }
  const id = crypto.randomUUID()
  await db.insert(tournamentRequests).values({
    id,
    roomId: body.roomId,
    requesterId: req.uid!,
    name: body.name,
    format: body.format,
    numPlayers: body.numPlayers,
    description: body.description,
    proposedDate: body.proposedDate,
    message: body.message ?? '',
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const admins = await db.select().from(users).where(eq(users.role, 'admin'))
  await Promise.all(
    admins.map((a) =>
      notify(a.id, {
        type: 'tournament_open',
        title: 'New tournament request',
        message: `A new tournament request was submitted: ${body.name}`,
        link: '/requests',
      }),
    ),
  )

  res.status(201).json((await db.select().from(tournamentRequests).where(eq(tournamentRequests.id, id)))[0])
})

requestsRouter.post('/:id/approve', requireAdmin, async (req, res) => {
  const { bannerUrl, rules, registrationDeadline, maxPlayers } = req.body as {
    bannerUrl?: string
    rules?: string
    registrationDeadline: number
    maxPlayers?: number
  }
  const requestId = req.params.id as string
  const [request] = await db.select().from(tournamentRequests).where(eq(tournamentRequests.id, requestId)).limit(1)
  if (!request) {
    res.status(404).json({ error: 'Request not found' })
    return
  }

  const tournamentId = crypto.randomUUID()
  await db.insert(tournaments).values({
    id: tournamentId,
    roomId: request.roomId,
    name: request.name,
    description: request.description,
    bannerUrl: bannerUrl ?? '',
    format: request.format,
    status: 'upcoming',
    startDate: request.proposedDate,
    registrationDeadline,
    maxPlayers: maxPlayers ?? request.numPlayers,
    rules: rules ?? '',
    createdBy: request.requesterId,
    createdAt: Date.now(),
  })

  await db
    .update(tournamentRequests)
    .set({ status: 'approved', linkedTournamentId: tournamentId, updatedAt: Date.now() })
    .where(eq(tournamentRequests.id, request.id))

  await notify(request.requesterId, {
    type: 'request_approved',
    title: 'Tournament request approved',
    message: `${request.name} is now live!`,
    link: `/tournaments/${tournamentId}`,
  })

  res.status(201).json({ tournamentId })
})

requestsRouter.post('/:id/reject', requireAdmin, async (req, res) => {
  const { reason } = req.body as { reason?: string }
  const requestId = req.params.id as string
  const [request] = await db.select().from(tournamentRequests).where(eq(tournamentRequests.id, requestId)).limit(1)
  if (!request) {
    res.status(404).json({ error: 'Request not found' })
    return
  }
  await db
    .update(tournamentRequests)
    .set({ status: 'rejected', adminNote: reason ?? '', updatedAt: Date.now() })
    .where(eq(tournamentRequests.id, request.id))
  await notify(request.requesterId, {
    type: 'request_rejected',
    title: 'Tournament request rejected',
    message: reason || `Your request "${request.name}" was not approved.`,
    link: '/requests',
  })
  res.status(204).end()
})

requestsRouter.post('/:id/postpone', requireAdmin, async (req, res) => {
  const { note } = req.body as { note?: string }
  const requestId = req.params.id as string
  const [request] = await db.select().from(tournamentRequests).where(eq(tournamentRequests.id, requestId)).limit(1)
  if (!request) {
    res.status(404).json({ error: 'Request not found' })
    return
  }
  await db
    .update(tournamentRequests)
    .set({ status: 'postponed', adminNote: note ?? '', updatedAt: Date.now() })
    .where(eq(tournamentRequests.id, request.id))
  await notify(request.requesterId, {
    type: 'request_postponed',
    title: 'Tournament request postponed',
    message: note || `Your request "${request.name}" was postponed.`,
    link: '/requests',
  })
  res.status(204).end()
})
