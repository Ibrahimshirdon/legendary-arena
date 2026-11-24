import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import {
  matches,
  tournamentParticipants,
  tournamentRegistrations,
  tournaments,
  trophies,
} from '../db/schema'
import {
  BYE,
  KNOCKOUT_STAGE_ROUND_OFFSET,
  generateFixturesForFormat,
  generateKnockoutNextRound,
  generateSeededKnockoutRound,
} from '../lib/fixtures'
import { computeStandings } from '../lib/standings'
import { requireAuth } from '../middleware/auth'
import { attachProfile, requireAdmin, requireApproved } from '../middleware/roles'
import { notifyMany } from './notifications'
import { incrementUserStats } from './users'

export const tournamentsRouter = Router()
tournamentsRouter.use(requireAuth, attachProfile)

async function serializeTournaments() {
  const [all, regs, parts] = await Promise.all([
    db.select().from(tournaments),
    db.select().from(tournamentRegistrations),
    db.select().from(tournamentParticipants),
  ])
  return all.map((t) => ({
    ...t,
    pointSystem: { win: t.pointWin, draw: t.pointDraw, loss: t.pointLoss },
    registeredIds: regs.filter((r) => r.tournamentId === t.id).map((r) => r.userId),
    participantIds: parts.filter((p) => p.tournamentId === t.id).map((p) => p.participantId),
  }))
}

tournamentsRouter.get('/', async (_req, res) => {
  res.json(await serializeTournaments())
})

tournamentsRouter.post('/', requireAdmin, async (req, res) => {
  const body = req.body as {
    roomId: string
    name: string
    description: string
    bannerUrl?: string
    format: string
    startDate: number
    registrationDeadline: number
    maxPlayers: number
    rules?: string
    pointSystem?: { win: number; draw: number; loss: number }
  }
  const id = crypto.randomUUID()
  await db.insert(tournaments).values({
    id,
    roomId: body.roomId,
    name: body.name,
    description: body.description ?? '',
    bannerUrl: body.bannerUrl ?? '',
    format: body.format,
    status: 'upcoming',
    startDate: body.startDate,
    registrationDeadline: body.registrationDeadline,
    maxPlayers: body.maxPlayers,
    rules: body.rules ?? '',
    pointWin: body.pointSystem?.win ?? 3,
    pointDraw: body.pointSystem?.draw ?? 1,
    pointLoss: body.pointSystem?.loss ?? 0,
    createdBy: req.uid!,
    createdAt: Date.now(),
  })
  res.status(201).json((await serializeTournaments()).find((t) => t.id === id))
})

tournamentsRouter.post('/:id/register', requireApproved, async (req, res) => {
  const tournamentId = req.params.id as string
  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1)
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' })
    return
  }
  const regs = await db.select().from(tournamentRegistrations).where(eq(tournamentRegistrations.tournamentId, tournament.id))
  if (regs.length >= tournament.maxPlayers) {
    res.status(400).json({ error: 'This tournament is full.' })
    return
  }
  await db.insert(tournamentRegistrations).values({ tournamentId: tournament.id, userId: req.uid! }).onConflictDoNothing()
  res.status(204).end()
})

tournamentsRouter.post('/:id/cancel-registration', requireApproved, async (req, res) => {
  const tournamentId = req.params.id as string
  await db
    .delete(tournamentRegistrations)
    .where(
      and(eq(tournamentRegistrations.tournamentId, tournamentId), eq(tournamentRegistrations.userId, req.uid!)),
    )
  res.status(204).end()
})

tournamentsRouter.post('/:id/open-registration', requireAdmin, async (req, res) => {
  const tournamentId = req.params.id as string
  await db.update(tournaments).set({ status: 'registration_open' }).where(eq(tournaments.id, tournamentId))
  res.status(204).end()
})

tournamentsRouter.post('/:id/start', requireAdmin, async (req, res) => {
  const { participantIds } = req.body as { participantIds: string[] }
  const tournamentId = req.params.id as string
  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1)
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' })
    return
  }

  const fixtures = generateFixturesForFormat(tournament.format as never, participantIds)

  await db.update(tournaments).set({ status: 'active' }).where(eq(tournaments.id, tournament.id))
  await db.insert(tournamentParticipants).values(
    participantIds.map((participantId) => ({ tournamentId: tournament.id, participantId })),
  )
  await db.insert(matches).values(
    fixtures.map((m) => ({
      id: crypto.randomUUID(),
      tournamentId: tournament.id,
      roomId: tournament.roomId,
      round: m.round,
      roundOrder: m.roundOrder,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      status: m.status,
      scheduledAt: Date.now(),
      winnerId: m.winnerId,
      createdAt: Date.now(),
    })),
  )

  await notifyMany(participantIds.filter((id) => id !== BYE), {
    type: 'match_scheduled',
    title: 'Tournament started',
    message: `${tournament.name} is underway. Check your fixtures.`,
    link: `/tournaments/${tournament.id}`,
  })

  res.status(204).end()
})

tournamentsRouter.post('/:id/generate-next-round', requireAdmin, async (req, res) => {
  const tournamentId = req.params.id as string
  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1)
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' })
    return
  }
  const all = await db.select().from(matches).where(eq(matches.tournamentId, tournament.id))
  const maxRoundOrder = Math.max(...all.map((m) => m.roundOrder))
  const currentRound = all.filter((m) => m.roundOrder === maxRoundOrder)

  if (currentRound.some((m) => m.status !== 'completed')) {
    res.status(400).json({ error: 'All matches in the current round must be completed first.' })
    return
  }

  const winners = currentRound
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => m.winnerId)
    .filter((id): id is string => Boolean(id))

  if (winners.length <= 1) {
    res.json({ finished: true, champion: winners[0] })
    return
  }

  const nextMatches = generateKnockoutNextRound(winners, maxRoundOrder + 1)
  await db.insert(matches).values(
    nextMatches.map((m) => ({
      id: crypto.randomUUID(),
      tournamentId: tournament.id,
      roomId: tournament.roomId,
      round: m.round,
      roundOrder: m.roundOrder,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      status: m.status,
      scheduledAt: Date.now(),
      winnerId: m.winnerId,
      createdAt: Date.now(),
    })),
  )
  res.json({ finished: false })
})

tournamentsRouter.post('/:id/generate-knockout-stage', requireAdmin, async (req, res) => {
  const { advanceCount } = req.body as { advanceCount: number }
  const tournamentId = req.params.id as string
  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1)
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' })
    return
  }
  const parts = await db.select().from(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournament.id))
  const allMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournament.id))
  const groupMatches = allMatches.filter((m) => m.roundOrder < KNOCKOUT_STAGE_ROUND_OFFSET)

  if (groupMatches.some((m) => m.status !== 'completed')) {
    res.status(400).json({ error: 'All group-stage matches must be completed first.' })
    return
  }

  const standings = computeStandings(
    parts.map((p) => p.participantId),
    groupMatches,
    { win: tournament.pointWin, draw: tournament.pointDraw, loss: tournament.pointLoss },
  )
  const qualifiers = standings.slice(0, advanceCount).map((row) => row.playerId)

  const knockoutMatches = generateSeededKnockoutRound(qualifiers, KNOCKOUT_STAGE_ROUND_OFFSET + 1)
  await db.insert(matches).values(
    knockoutMatches.map((m) => ({
      id: crypto.randomUUID(),
      tournamentId: tournament.id,
      roomId: tournament.roomId,
      round: m.round,
      roundOrder: m.roundOrder,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      status: m.status,
      scheduledAt: Date.now(),
      winnerId: m.winnerId,
      createdAt: Date.now(),
    })),
  )

  await notifyMany(qualifiers, {
    type: 'match_scheduled',
    title: 'Knockout stage set',
    message: `You qualified for the knockout stage of ${tournament.name}!`,
    link: `/tournaments/${tournament.id}`,
  })

  res.status(204).end()
})

tournamentsRouter.post('/:id/finalize', requireAdmin, async (req, res) => {
  const { championId, runnerUpId, thirdPlaceId } = req.body as {
    championId: string
    runnerUpId: string
    thirdPlaceId?: string
  }
  const tournamentId = req.params.id as string
  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1)
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' })
    return
  }

  await db
    .update(tournaments)
    .set({ status: 'completed', championId, runnerUpId, thirdPlaceId: thirdPlaceId ?? null })
    .where(eq(tournaments.id, tournament.id))

  await db.insert(trophies).values({
    id: crypto.randomUUID(),
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    roomId: tournament.roomId,
    format: tournament.format,
    winnerId: championId,
    runnerUpId,
    thirdPlaceId: thirdPlaceId ?? null,
    date: Date.now(),
  })

  const parts = await db.select().from(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournament.id))
  const realParticipants = parts.map((p) => p.participantId).filter((id) => id !== BYE)

  for (const uid of realParticipants) {
    await incrementUserStats(uid, { tournamentsPlayed: 1 })
  }
  await incrementUserStats(championId, { trophies: 1 })
  await incrementUserStats(runnerUpId, { runnerUps: 1 })
  if (thirdPlaceId) await incrementUserStats(thirdPlaceId, { thirdPlaces: 1 })

  await notifyMany(realParticipants, {
    type: 'tournament_completed',
    title: 'Tournament completed',
    message: `${tournament.name} has finished. Check the Hall of Fame!`,
    link: '/hall-of-fame',
  })

  res.status(204).end()
})
