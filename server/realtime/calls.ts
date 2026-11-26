import type { IncomingMessage, Server } from 'node:http'
import { and, eq } from 'drizzle-orm'
import { WebSocketServer, type WebSocket } from 'ws'
import { db } from '../db/client'
import { roomMembers, users } from '../db/schema'
import { adminAuth } from '../firebaseAdmin'

// A group call is just "whoever's socket is connected for this roomId" — there's
// no separate call/session record, the presence map IS the call. Single server
// instance only (fine at this app's scale: no horizontal scaling to worry about).
const MAX_PEERS_PER_ROOM = 4

interface Peer {
  ws: WebSocket
  uid: string
  username: string
}

const rooms = new Map<string, Map<string, Peer>>()

function roomPeers(roomId: string) {
  return rooms.get(roomId) ?? new Map<string, Peer>()
}

export function getCallPresence(roomId: string) {
  return [...roomPeers(roomId).values()].map((p) => ({ uid: p.uid, username: p.username }))
}

function send(ws: WebSocket, data: unknown) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data))
}

function broadcast(roomId: string, data: unknown, exceptUid?: string) {
  for (const peer of roomPeers(roomId).values()) {
    if (peer.uid !== exceptUid) send(peer.ws, data)
  }
}

function removePeer(roomId: string, uid: string) {
  const peers = rooms.get(roomId)
  if (!peers) return
  peers.delete(uid)
  if (peers.size === 0) rooms.delete(roomId)
  broadcast(roomId, { type: 'peer-left', uid })
}

export function attachCallSignaling(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/calls' })

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? '', 'http://internal')
    const roomId = url.searchParams.get('roomId')
    const token = url.searchParams.get('token')

    if (!roomId || !token) {
      ws.close(4000, 'Missing roomId or token')
      return
    }

    let uid: string
    try {
      uid = (await adminAuth.verifyIdToken(token)).uid
    } catch {
      ws.close(4001, 'Invalid token')
      return
    }

    const [membership] = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, uid)))
      .limit(1)
    if (!membership) {
      ws.close(4003, 'Not a member of this room')
      return
    }

    const peers = rooms.get(roomId) ?? new Map<string, Peer>()
    rooms.set(roomId, peers)
    if (peers.size >= MAX_PEERS_PER_ROOM) {
      ws.close(4029, 'Call is full')
      return
    }

    const [profile] = await db.select().from(users).where(eq(users.id, uid)).limit(1)
    const username = profile?.username ?? 'Member'

    // Existing peers first, THEN register the newcomer — otherwise they'd be
    // sent their own entry back in the peer list.
    send(ws, { type: 'peers', peers: getCallPresence(roomId) })
    peers.set(uid, { ws, uid, username })
    broadcast(roomId, { type: 'peer-joined', uid, username }, uid)

    ws.on('message', (raw) => {
      let msg: { type: string; to?: string; [key: string]: unknown }
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (msg.to) {
        const target = peers.get(msg.to)
        if (target) send(target.ws, { ...msg, from: uid })
        return
      }
      broadcast(roomId, { ...msg, from: uid }, uid)
    })

    ws.on('close', () => removePeer(roomId, uid))
    ws.on('error', () => removePeer(roomId, uid))
  })

  return wss
}
