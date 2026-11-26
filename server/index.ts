import './loadEnv'

import cors from 'cors'
import express from 'express'
import { db } from './db/client'
import { bootstrap } from './db/schema'
import { attachCallSignaling } from './realtime/calls'
import { callsRouter } from './routes/calls'
import { matchesRouter } from './routes/matches'
import { notificationsRouter } from './routes/notifications'
import { requestsRouter } from './routes/requests'
import { roomsRouter } from './routes/rooms'
import { tournamentsRouter } from './routes/tournaments'
import { trophiesRouter } from './routes/trophies'
import { usersRouter } from './routes/users'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/users', usersRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/tournaments', tournamentsRouter)
app.use('/api/tournament-requests', requestsRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/trophies', trophiesRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/calls', callsRouter)

const port = Number(process.env.PORT ?? 8787)

// Ensure the one-time admin-bootstrap row exists before accepting requests.
await db.insert(bootstrap).values({ id: true, claimed: false }).onConflictDoNothing()

const server = app.listen(port, () => {
  console.log(`Legendary Arena API listening on http://localhost:${port}`)
})

attachCallSignaling(server)
