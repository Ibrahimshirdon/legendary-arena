import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getCallPresence } from '../realtime/calls'

export const callsRouter = Router()
callsRouter.use(requireAuth)

callsRouter.get('/ice-servers', (_req, res) => {
  const iceServers: { urls: string | string[]; username?: string; credential?: string }[] = [
    { urls: 'stun:stun.l.google.com:19302' },
  ]

  const turnUrls = process.env.TURN_URL?.split(',').map((u) => u.trim()).filter(Boolean)
  if (turnUrls?.length) {
    iceServers.push({
      urls: turnUrls,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    })
  }

  res.json({ iceServers })
})

callsRouter.get('/:roomId/presence', (req, res) => {
  const roomId = req.params.roomId as string
  res.json({ peers: getCallPresence(roomId) })
})
