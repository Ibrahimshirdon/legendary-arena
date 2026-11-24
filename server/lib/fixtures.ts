export const BYE = 'BYE'
export const KNOCKOUT_STAGE_ROUND_OFFSET = 1000

export interface DraftMatch {
  round: string
  roundOrder: number
  player1Id: string
  player2Id: string
  status: 'upcoming' | 'completed'
  winnerId: string | null
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function knockoutRoundLabel(playersInRound: number) {
  if (playersInRound <= 2) return 'Final'
  if (playersInRound <= 4) return 'Semi-final'
  if (playersInRound <= 8) return 'Quarter-final'
  return `Round of ${playersInRound}`
}

function baseMatch(round: string, roundOrder: number, player1Id: string, player2Id: string): DraftMatch {
  const isBye = player2Id === BYE
  return {
    round,
    roundOrder,
    player1Id,
    player2Id,
    status: isBye ? 'completed' : 'upcoming',
    winnerId: isBye ? player1Id : null,
  }
}

export function generateKnockoutFirstRound(participantIds: string[], roundOrder = 1): DraftMatch[] {
  const players = shuffle(participantIds)
  let size = 1
  while (size < players.length) size *= 2
  const slots: string[] = [...players]
  for (let i = 0; i < size - players.length; i++) slots.push(BYE)

  const round = knockoutRoundLabel(size)
  const matches: DraftMatch[] = []
  for (let i = 0; i < slots.length; i += 2) {
    matches.push(baseMatch(round, roundOrder, slots[i], slots[i + 1]))
  }
  return matches
}

export function generateKnockoutNextRound(previousRoundWinners: string[], nextRoundOrder: number): DraftMatch[] {
  const round = knockoutRoundLabel(previousRoundWinners.length)
  const matches: DraftMatch[] = []
  for (let i = 0; i < previousRoundWinners.length; i += 2) {
    matches.push(baseMatch(round, nextRoundOrder, previousRoundWinners[i], previousRoundWinners[i + 1]))
  }
  return matches
}

export function generateRoundRobin(participantIds: string[]): DraftMatch[] {
  const players = shuffle(participantIds)
  if (players.length % 2 !== 0) players.push(BYE)

  const n = players.length
  const half = n / 2
  const matches: DraftMatch[] = []
  const arr = [...players]

  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < half; i++) {
      const home = arr[i]
      const away = arr[n - 1 - i]
      if (home !== BYE && away !== BYE) {
        matches.push(baseMatch(`Matchday ${round + 1}`, round + 1, home, away))
      }
    }
    const fixed = arr[0]
    const rest = arr.slice(1)
    rest.unshift(rest.pop() as string)
    arr.splice(0, arr.length, fixed, ...rest)
  }

  return matches
}

export function generateFixturesForFormat(
  format: 'knockout' | 'league' | 'group_knockout' | 'friendly',
  participantIds: string[],
): DraftMatch[] {
  if (format === 'knockout') return generateKnockoutFirstRound(participantIds)
  return generateRoundRobin(participantIds)
}

function seedOrder(size: number): number[] {
  let seeds = [1]
  while (seeds.length < size) {
    const k = seeds.length * 2
    const next: number[] = []
    for (const s of seeds) next.push(s, k + 1 - s)
    seeds = next
  }
  return seeds
}

export function generateSeededKnockoutRound(rankedPlayerIds: string[], roundOrder: number): DraftMatch[] {
  let size = 1
  while (size < rankedPlayerIds.length) size *= 2
  const order = seedOrder(size)
  const slots = order.map((seed) => rankedPlayerIds[seed - 1] ?? BYE)

  const round = knockoutRoundLabel(size)
  const matches: DraftMatch[] = []
  for (let i = 0; i < slots.length; i += 2) {
    matches.push(baseMatch(round, roundOrder, slots[i], slots[i + 1]))
  }
  return matches
}
