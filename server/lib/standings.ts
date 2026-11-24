import { BYE } from './fixtures'

interface MatchLike {
  player1Id: string
  player2Id: string
  status: string
  score1: number | null
  score2: number | null
  roundOrder: number
}

export interface StandingRow {
  playerId: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export function computeStandings(
  participantIds: string[],
  matches: MatchLike[],
  pointSystem: { win: number; draw: number; loss: number },
): StandingRow[] {
  const table = new Map<string, StandingRow>()
  for (const id of participantIds) {
    if (id === BYE) continue
    table.set(id, { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })
  }

  for (const match of matches) {
    if (match.status !== 'completed') continue
    if (match.player1Id === BYE || match.player2Id === BYE) continue
    if (match.score1 === null || match.score2 === null) continue

    const p1 = table.get(match.player1Id)
    const p2 = table.get(match.player2Id)
    if (!p1 || !p2) continue

    p1.played++
    p2.played++
    p1.goalsFor += match.score1
    p1.goalsAgainst += match.score2
    p2.goalsFor += match.score2
    p2.goalsAgainst += match.score1

    if (match.score1 > match.score2) {
      p1.wins++
      p1.points += pointSystem.win
      p2.losses++
      p2.points += pointSystem.loss
    } else if (match.score1 < match.score2) {
      p2.wins++
      p2.points += pointSystem.win
      p1.losses++
      p1.points += pointSystem.loss
    } else {
      p1.draws++
      p2.draws++
      p1.points += pointSystem.draw
      p2.points += pointSystem.draw
    }
  }

  for (const row of table.values()) row.goalDifference = row.goalsFor - row.goalsAgainst

  return Array.from(table.values()).sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor,
  )
}
