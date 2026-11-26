import '../loadEnv'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { matches, trophies, tournamentParticipants, tournaments, users } from '../db/schema'
import { BYE } from '../lib/fixtures'

interface Totals {
  tournamentsPlayed: number
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  goalsFor: number
  goalsAgainst: number
  points: number
  trophies: number
  runnerUps: number
  thirdPlaces: number
}

function emptyTotals(): Totals {
  return {
    tournamentsPlayed: 0,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    trophies: 0,
    runnerUps: 0,
    thirdPlaces: 0,
  }
}

async function main() {
  const [allUsers, allMatches, allTrophies, allTournaments, allParticipants] = await Promise.all([
    db.select().from(users),
    db.select().from(matches),
    db.select().from(trophies),
    db.select().from(tournaments),
    db.select().from(tournamentParticipants),
  ])

  const pointSystemByTournament = new Map<string | null, { win: number; draw: number; loss: number }>(
    allTournaments.map((t) => [t.id, { win: t.pointWin, draw: t.pointDraw, loss: t.pointLoss }]),
  )

  const totals = new Map<string, Totals>()
  const get = (uid: string) => {
    if (!totals.has(uid)) totals.set(uid, emptyTotals())
    return totals.get(uid)!
  }

  for (const m of allMatches) {
    if (m.status !== 'completed' || m.score1 === null || m.score2 === null) continue
    if (m.player1Id === BYE || m.player2Id === BYE) continue
    const pointSystem = pointSystemByTournament.get(m.tournamentId) ?? { win: 3, draw: 1, loss: 0 }
    const isDraw = m.score1 === m.score2
    const winnerId = isDraw ? null : m.score1 > m.score2 ? m.player1Id : m.player2Id

    const p1 = get(m.player1Id)
    p1.matchesPlayed += 1
    p1.goalsFor += m.score1
    p1.goalsAgainst += m.score2
    if (isDraw) {
      p1.draws += 1
      p1.points += pointSystem.draw
    } else if (winnerId === m.player1Id) {
      p1.wins += 1
      p1.points += pointSystem.win
    } else {
      p1.losses += 1
      p1.points += pointSystem.loss
    }

    const p2 = get(m.player2Id)
    p2.matchesPlayed += 1
    p2.goalsFor += m.score2
    p2.goalsAgainst += m.score1
    if (isDraw) {
      p2.draws += 1
      p2.points += pointSystem.draw
    } else if (winnerId === m.player2Id) {
      p2.wins += 1
      p2.points += pointSystem.win
    } else {
      p2.losses += 1
      p2.points += pointSystem.loss
    }
  }

  for (const t of allTrophies) {
    get(t.winnerId).trophies += 1
    get(t.runnerUpId).runnerUps += 1
    if (t.thirdPlaceId) get(t.thirdPlaceId).thirdPlaces += 1
  }

  const completedTournamentIds = new Set(allTournaments.filter((t) => t.status === 'completed').map((t) => t.id))
  for (const p of allParticipants) {
    if (p.participantId === BYE) continue
    if (!completedTournamentIds.has(p.tournamentId)) continue
    get(p.participantId).tournamentsPlayed += 1
  }

  for (const user of allUsers) {
    const t = totals.get(user.id) ?? emptyTotals()
    await db.update(users).set(t).where(eq(users.id, user.id))
    console.log(`${user.username}: ${JSON.stringify(t)}`)
  }

  console.log(`Recalculated stats for ${allUsers.length} users.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
