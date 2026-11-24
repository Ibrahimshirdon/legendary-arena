import { BYE } from '@/lib/fixtures'
import type { Achievement, AchievementKey, Match, Tournament } from '@/types'

export const ACHIEVEMENTS: Record<AchievementKey, Achievement> = {
  first_trophy: {
    key: 'first_trophy',
    label: 'First Trophy',
    description: 'Won your first tournament',
    icon: 'Trophy',
  },
  three_time_champion: {
    key: 'three_time_champion',
    label: 'Three-Time Champion',
    description: 'Won 3 tournaments',
    icon: 'Crown',
  },
  five_time_champion: {
    key: 'five_time_champion',
    label: 'Five-Time Champion',
    description: 'Won 5 tournaments',
    icon: 'Crown',
  },
  unbeaten_season: {
    key: 'unbeaten_season',
    label: 'Unbeaten',
    description: 'Won a tournament without losing a single match',
    icon: 'ShieldCheck',
  },
  comeback_king: {
    key: 'comeback_king',
    label: 'Comeback King',
    description: 'Won a tournament after losing a match along the way',
    icon: 'Flame',
  },
  goal_machine: {
    key: 'goal_machine',
    label: 'Goal Machine',
    description: 'Scored 25+ goals across all matches',
    icon: 'Target',
  },
  rivalry_winner: {
    key: 'rivalry_winner',
    label: 'Rivalry Winner',
    description: 'Beat the same opponent 3+ times',
    icon: 'Swords',
  },
}

export function computeAchievements(
  uid: string,
  matches: Match[],
  tournaments: Tournament[],
): Achievement[] {
  const earned = new Set<AchievementKey>()

  const championedTournaments = tournaments.filter((t) => t.championId === uid)
  const championCount = championedTournaments.length

  if (championCount >= 1) earned.add('first_trophy')
  if (championCount >= 3) earned.add('three_time_champion')
  if (championCount >= 5) earned.add('five_time_champion')

  for (const tournament of championedTournaments) {
    const tMatches = matches.filter(
      (m) =>
        m.tournamentId === tournament.id &&
        m.status === 'completed' &&
        m.player1Id !== BYE &&
        m.player2Id !== BYE &&
        (m.player1Id === uid || m.player2Id === uid),
    )
    const lost = tMatches.some((m) => m.winnerId && m.winnerId !== uid && !m.isDraw)
    if (!lost && tMatches.length > 0) earned.add('unbeaten_season')
    if (lost) earned.add('comeback_king')
  }

  let goalsFor = 0
  const headToHeadWins = new Map<string, number>()

  for (const m of matches) {
    if (m.status !== 'completed' || m.player1Id === BYE || m.player2Id === BYE) continue
    if (m.player1Id !== uid && m.player2Id !== uid) continue
    const isP1 = m.player1Id === uid
    const myGoals = isP1 ? m.score1 : m.score2
    if (typeof myGoals === 'number') goalsFor += myGoals

    if (m.winnerId === uid) {
      const opponent = isP1 ? m.player2Id : m.player1Id
      headToHeadWins.set(opponent, (headToHeadWins.get(opponent) ?? 0) + 1)
    }
  }

  if (goalsFor >= 25) earned.add('goal_machine')
  if (Array.from(headToHeadWins.values()).some((wins) => wins >= 3)) earned.add('rivalry_winner')

  return Array.from(earned).map((key) => ACHIEVEMENTS[key])
}
