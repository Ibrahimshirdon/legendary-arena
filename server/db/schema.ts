import {
  bigint,
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase Auth UID
  username: text('username').notNull(),
  usernameLower: text('username_lower').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  avatarUrl: text('avatar_url').notNull().default(''),
  role: text('role').notNull().default('member'), // 'member' | 'admin'
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'banned'
  favoriteTeam: text('favorite_team'),
  bio: text('bio'),
  online: boolean('online').notNull().default(false),
  lastSeen: bigint('last_seen', { mode: 'number' }).notNull().default(0),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),

  tournamentsPlayed: integer('tournaments_played').notNull().default(0),
  matchesPlayed: integer('matches_played').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  goalsFor: integer('goals_for').notNull().default(0),
  goalsAgainst: integer('goals_against').notNull().default(0),
  points: integer('points').notNull().default(0),
  trophies: integer('trophies').notNull().default(0),
  runnerUps: integer('runner_ups').notNull().default(0),
  thirdPlaces: integer('third_places').notNull().default(0),
})

// Singleton row: atomically claims the one-time admin bootstrap slot.
export const bootstrap = pgTable('bootstrap', {
  id: boolean('id').primaryKey().default(true),
  claimed: boolean('claimed').notNull().default(false),
})

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  bannerUrl: text('banner_url').notNull().default(''),
  inviteCode: text('invite_code').notNull().unique(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
})

export const roomMembers = pgTable(
  'room_members',
  {
    roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roomId, t.userId] })],
)

export const roomPendingRequests = pgTable(
  'room_pending_requests',
  {
    roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roomId, t.userId] })],
)

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id),
  text: text('text').notNull().default(''),
  imageUrl: text('image_url'),
  replyToId: text('reply_to_id'),
  isAnnouncement: boolean('is_announcement').notNull().default(false),
  deleted: boolean('deleted').notNull().default(false),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
})

export const messageReactions = pgTable(
  'message_reactions',
  {
    messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.emoji, t.userId] })],
)

export const roomAnnouncements = pgTable('room_announcements', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
})

export const tournaments = pgTable('tournaments', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  bannerUrl: text('banner_url').notNull().default(''),
  description: text('description').notNull().default(''),
  format: text('format').notNull(), // knockout | league | group_knockout | friendly
  status: text('status').notNull().default('upcoming'),
  startDate: bigint('start_date', { mode: 'number' }).notNull(),
  registrationDeadline: bigint('registration_deadline', { mode: 'number' }).notNull(),
  maxPlayers: integer('max_players').notNull(),
  rules: text('rules').notNull().default(''),
  pointWin: integer('point_win').notNull().default(3),
  pointDraw: integer('point_draw').notNull().default(1),
  pointLoss: integer('point_loss').notNull().default(0),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  championId: text('champion_id'),
  runnerUpId: text('runner_up_id'),
  thirdPlaceId: text('third_place_id'),
})

export const tournamentRegistrations = pgTable(
  'tournament_registrations',
  {
    tournamentId: text('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.tournamentId, t.userId] })],
)

// Not FK-constrained to users: a participant slot may hold the 'BYE' sentinel.
export const tournamentParticipants = pgTable(
  'tournament_participants',
  {
    tournamentId: text('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
    participantId: text('participant_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.tournamentId, t.participantId] })],
)

export const tournamentRequests = pgTable('tournament_requests', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  requesterId: text('requester_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  format: text('format').notNull(),
  numPlayers: integer('num_players').notNull(),
  description: text('description').notNull().default(''),
  proposedDate: bigint('proposed_date', { mode: 'number' }).notNull(),
  message: text('message').default(''),
  status: text('status').notNull().default('pending'),
  adminNote: text('admin_note'),
  linkedTournamentId: text('linked_tournament_id'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
})

// Player columns are plain text (not FK) so a 'BYE' sentinel can be stored.
// tournamentId is nullable: a standalone friendly challenge between two room
// members has no tournament at all.
export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  round: text('round').notNull(),
  roundOrder: integer('round_order').notNull(),
  player1Id: text('player1_id').notNull(),
  player2Id: text('player2_id').notNull(),
  score1: integer('score1'),
  score2: integer('score2'),
  status: text('status').notNull().default('upcoming'),
  scheduledAt: bigint('scheduled_at', { mode: 'number' }).notNull(),
  submission1Score1: integer('submission1_score1'),
  submission1Score2: integer('submission1_score2'),
  submission1At: bigint('submission1_at', { mode: 'number' }),
  submission2Score1: integer('submission2_score1'),
  submission2Score2: integer('submission2_score2'),
  submission2At: bigint('submission2_at', { mode: 'number' }),
  winnerId: text('winner_id'),
  isDraw: boolean('is_draw').notNull().default(false),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
})

export const trophies = pgTable('trophies', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  tournamentName: text('tournament_name').notNull(),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  format: text('format').notNull(),
  winnerId: text('winner_id').notNull().references(() => users.id),
  runnerUpId: text('runner_up_id').notNull().references(() => users.id),
  thirdPlaceId: text('third_place_id').references(() => users.id),
  date: bigint('date', { mode: 'number' }).notNull(),
})

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link').default(''),
  read: boolean('read').notNull().default(false),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
})
