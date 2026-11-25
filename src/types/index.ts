export type UserRole = 'admin' | 'member'
export type AccountStatus = 'unverified' | 'pending' | 'approved' | 'rejected' | 'banned'

export interface UserProfile {
  uid: string
  username: string
  usernameLower: string
  fullName: string
  email: string
  phone?: string
  avatarUrl: string
  role: UserRole
  status: AccountStatus
  favoriteTeam?: string
  bio?: string
  online: boolean
  lastSeen: number
  createdAt: number
  stats: PlayerStats
}

export interface PlayerStats {
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

export const EMPTY_STATS: PlayerStats = {
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

export interface Room {
  id: string
  name: string
  description: string
  bannerUrl: string
  inviteCode: string
  ownerId: string
  memberIds: string[]
  pendingRequestIds: string[]
  createdAt: number
}

export interface RoomAnnouncement {
  id: string
  roomId: string
  authorId: string
  title: string
  message: string
  createdAt: number
}

export type MessageReaction = Record<string, string[]>

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  text: string
  replyToId?: string | null
  reactions: MessageReaction
  isAnnouncement: boolean
  deleted: boolean
  createdAt: number
}

export type TournamentFormat = 'knockout' | 'league' | 'group_knockout' | 'friendly'
export type TournamentStatus =
  | 'upcoming'
  | 'registration_open'
  | 'active'
  | 'completed'
  | 'cancelled'

export interface PointSystem {
  win: number
  draw: number
  loss: number
}

export const DEFAULT_POINT_SYSTEM: PointSystem = { win: 3, draw: 1, loss: 0 }

export interface Tournament {
  id: string
  roomId: string
  name: string
  bannerUrl: string
  description: string
  format: TournamentFormat
  status: TournamentStatus
  startDate: number
  registrationDeadline: number
  maxPlayers: number
  rules: string
  participantIds: string[]
  registeredIds: string[]
  pointSystem: PointSystem
  createdBy: string
  createdAt: number
  championId?: string
  runnerUpId?: string
  thirdPlaceId?: string
}

export type TournamentRequestStatus = 'pending' | 'approved' | 'rejected' | 'postponed'

export interface TournamentRequest {
  id: string
  roomId: string
  requesterId: string
  name: string
  format: TournamentFormat
  numPlayers: number
  description: string
  proposedDate: number
  message?: string
  status: TournamentRequestStatus
  adminNote?: string
  linkedTournamentId?: string
  createdAt: number
  updatedAt: number
}

export type MatchStatus = 'upcoming' | 'awaiting_result' | 'completed' | 'disputed'

export interface MatchResultSubmission {
  score1: number
  score2: number
  submittedAt: number
}

export interface Match {
  id: string
  tournamentId: string
  roomId: string
  round: string
  roundOrder: number
  player1Id: string
  player2Id: string
  score1: number | null
  score2: number | null
  status: MatchStatus
  scheduledAt: number
  submission1: MatchResultSubmission | null
  submission2: MatchResultSubmission | null
  winnerId: string | null
  isDraw: boolean
  createdAt: number
}

export interface Trophy {
  id: string
  tournamentId: string
  tournamentName: string
  roomId: string
  format: TournamentFormat
  winnerId: string
  runnerUpId: string
  thirdPlaceId?: string
  date: number
}

export type AchievementKey =
  | 'first_trophy'
  | 'three_time_champion'
  | 'five_time_champion'
  | 'unbeaten_season'
  | 'comeback_king'
  | 'goal_machine'
  | 'rivalry_winner'

export interface Achievement {
  key: AchievementKey
  label: string
  description: string
  icon: string
}

export type NotificationType =
  | 'tournament_open'
  | 'registration_open'
  | 'accepted'
  | 'match_scheduled'
  | 'result_submitted'
  | 'result_confirmed'
  | 'tournament_starting'
  | 'tournament_completed'
  | 'request_approved'
  | 'request_rejected'
  | 'request_postponed'
  | 'announcement'
  | 'room_joined'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: number
}
