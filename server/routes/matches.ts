import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client'
import { matches, tournaments } from '../db/schema'
import { BYE } from '../lib/fixtures'
import { requireAuth } from '../middleware/auth'
import { attachProfile, requireAdmin } from '../middleware/roles'
import { notify } from './notifications'
import { incrementUserStats, type StatsDelta } from './users'

export const matchesRouter = Router()
matchesRouter.use(requireAuth, attachProfile)

function serializeMatch(row: typeof matches.$inferSelect) {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    roomId: row.roomId,
    round: row.round,
    roundOrder: row.roundOrder,
    player1Id: row.player1Id,
    player2Id: row.player2Id,
    score1: row.score1,
    score2: row.score2,
    status: row.status,
    scheduledAt: row.scheduledAt,
    submission1:
      row.submission1Score1 !== null && row.submission1Score1 !== undefined
        ? { score1: row.submission1Score1, score2: row.submission1Score2!, submittedAt: row.submission1At! }
        : null,
    submission2:
      row.submission2Score1 !== null && row.submission2Score1 !== undefined
        ? { score1: row.submission2Score1, score2: row.submission2Score2!, submittedAt: row.submission2At! }
        : null,
    winnerId: row.winnerId,
    isDraw: row.isDraw,
    createdAt: row.createdAt,
  }
}

matchesRouter.get('/', async (_req, res) => {
  const rows = await db.select().from(matches)
  res.json(rows.map(serializeMatch))
})

function resultFor(score1: number, score2: number, player1Id: string, player2Id: string) {
  if (score1 === score2) return { winnerId: null as string | null, isDraw: true }
  return { winnerId: score1 > score2 ? player1Id : player2Id, isDraw: false }
}

export async function pointSystemFor(tournamentId: string) {
  const [t] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1)
  return { win: t?.pointWin ?? 3, draw: t?.pointDraw ?? 1, loss: t?.pointLoss ?? 0 }
}

export function statsDeltaFor(
  player1Id: string,
  player2Id: string,
  score1: number,
  score2: number,
  pointSystem: { win: number; draw: number; loss: number },
  sign: 1 | -1,
) {
  const { winnerId, isDraw } = resultFor(score1, score2, player1Id, player2Id)
  const p1Points = isDraw ? pointSystem.draw : winnerId === player1Id ? pointSystem.win : pointSystem.loss
  const p2Points = isDraw ? pointSystem.draw : winnerId === player2Id ? pointSystem.win : pointSystem.loss

  const player1: StatsDelta = {
    matchesPlayed: sign,
    wins: sign * (winnerId === player1Id ? 1 : 0),
    losses: sign * (winnerId === player2Id ? 1 : 0),
    draws: sign * (isDraw ? 1 : 0),
    goalsFor: sign * score1,
    goalsAgainst: sign * score2,
    points: sign * p1Points,
  }
  const player2: StatsDelta = {
    matchesPlayed: sign,
    wins: sign * (winnerId === player2Id ? 1 : 0),
    losses: sign * (winnerId === player1Id ? 1 : 0),
    draws: sign * (isDraw ? 1 : 0),
    goalsFor: sign * score2,
    goalsAgainst: sign * score1,
    points: sign * p2Points,
  }
  return { player1, player2 }
}

matchesRouter.post('/:id/submit-result', async (req, res) => {
  const { score1, score2 } = req.body as { score1: number; score2: number }
  const matchId = req.params.id as string
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
  if (!match) {
    res.status(404).json({ error: 'Match not found' })
    return
  }
  const uid = req.uid!
  const isPlayer1 = match.player1Id === uid
  const isPlayer2 = match.player2Id === uid
  if (!isPlayer1 && !isPlayer2) {
    res.status(403).json({ error: 'You are not part of this match' })
    return
  }

  const now = Date.now()
  const submission1 = isPlayer1
    ? { score1, score2, at: now }
    : match.submission1Score1 !== null
      ? { score1: match.submission1Score1, score2: match.submission1Score2!, at: match.submission1At! }
      : null
  const submission2 = isPlayer2
    ? { score1, score2, at: now }
    : match.submission2Score1 !== null
      ? { score1: match.submission2Score1, score2: match.submission2Score2!, at: match.submission2At! }
      : null

  if (submission1 && submission2) {
    const agree = submission1.score1 === submission2.score1 && submission1.score2 === submission2.score2
    if (agree) {
      const { winnerId, isDraw } = resultFor(submission1.score1, submission1.score2, match.player1Id, match.player2Id)
      const pointSystem = await pointSystemFor(match.tournamentId)
      const delta = statsDeltaFor(match.player1Id, match.player2Id, submission1.score1, submission1.score2, pointSystem, 1)

      await db
        .update(matches)
        .set({
          submission1Score1: submission1.score1,
          submission1Score2: submission1.score2,
          submission1At: submission1.at,
          submission2Score1: submission2.score1,
          submission2Score2: submission2.score2,
          submission2At: submission2.at,
          score1: submission1.score1,
          score2: submission1.score2,
          status: 'completed',
          winnerId,
          isDraw,
        })
        .where(eq(matches.id, match.id))

      await incrementUserStats(match.player1Id, delta.player1)
      await incrementUserStats(match.player2Id, delta.player2)

      await Promise.all(
        [match.player1Id, match.player2Id].map((id) =>
          notify(id, {
            type: 'result_confirmed',
            title: 'Result confirmed',
            message: `Final score: ${match.round} confirmed.`,
            link: `/tournaments/${match.tournamentId}`,
          }),
        ),
      )
      res.json({ status: 'completed' })
      return
    }

    await db
      .update(matches)
      .set({
        submission1Score1: submission1.score1,
        submission1Score2: submission1.score2,
        submission1At: submission1.at,
        submission2Score1: submission2.score1,
        submission2Score2: submission2.score2,
        submission2At: submission2.at,
        status: 'disputed',
      })
      .where(eq(matches.id, match.id))

    await Promise.all(
      [match.player1Id, match.player2Id].map((id) =>
        notify(id, {
          type: 'result_submitted',
          title: 'Match disputed',
          message: 'Submitted scores do not match. An admin will review this match.',
          link: `/tournaments/${match.tournamentId}`,
        }),
      ),
    )
    res.json({ status: 'disputed' })
    return
  }

  await db
    .update(matches)
    .set({
      ...(submission1 ? { submission1Score1: submission1.score1, submission1Score2: submission1.score2, submission1At: submission1.at } : {}),
      ...(submission2 ? { submission2Score1: submission2.score1, submission2Score2: submission2.score2, submission2At: submission2.at } : {}),
      status: 'awaiting_result',
    })
    .where(eq(matches.id, match.id))

  const opponentId = isPlayer1 ? match.player2Id : match.player1Id
  if (opponentId !== BYE) {
    await notify(opponentId, {
      type: 'result_submitted',
      title: 'Score submitted',
      message: 'Your opponent submitted a result. Confirm or submit your own score.',
      link: `/tournaments/${match.tournamentId}`,
    })
  }
  res.json({ status: 'awaiting_result' })
})

matchesRouter.post('/:id/admin-resolve', requireAdmin, async (req, res) => {
  const { score1, score2 } = req.body as { score1: number; score2: number }
  const matchId = req.params.id as string
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
  if (!match) {
    res.status(404).json({ error: 'Match not found' })
    return
  }
  const pointSystem = await pointSystemFor(match.tournamentId)

  if (match.status === 'completed' && match.score1 !== null && match.score2 !== null) {
    const reverse = statsDeltaFor(match.player1Id, match.player2Id, match.score1, match.score2, pointSystem, -1)
    await incrementUserStats(match.player1Id, reverse.player1)
    await incrementUserStats(match.player2Id, reverse.player2)
  }

  const { winnerId, isDraw } = resultFor(score1, score2, match.player1Id, match.player2Id)
  const apply = statsDeltaFor(match.player1Id, match.player2Id, score1, score2, pointSystem, 1)
  await incrementUserStats(match.player1Id, apply.player1)
  await incrementUserStats(match.player2Id, apply.player2)

  await db.update(matches).set({ score1, score2, status: 'completed', winnerId, isDraw }).where(eq(matches.id, match.id))

  await Promise.all(
    [match.player1Id, match.player2Id].map((id) =>
      notify(id, {
        type: 'result_confirmed',
        title: 'Match resolved by admin',
        message: `Final score set to ${score1} - ${score2}.`,
        link: `/tournaments/${match.tournamentId}`,
      }),
    ),
  )
  res.status(204).end()
})
