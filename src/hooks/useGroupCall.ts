import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase'
import { api } from '@/lib/api'

interface RemotePeer {
  uid: string
  username: string
  stream: MediaStream | null
  micMuted: boolean
}

type SignalMessage =
  | { type: 'peers'; peers: { uid: string; username: string }[] }
  | { type: 'peer-joined'; uid: string; username: string }
  | { type: 'peer-left'; uid: string }
  | { type: 'offer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; from: string; candidate: RTCIceCandidateInit }
  | { type: 'mic-state'; from: string; muted: boolean }

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
const WS_URL = API_URL.replace(/^http/, 'ws')

export function useGroupCall(roomId: string) {
  const [joined, setJoined] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Record<string, RemotePeer>>({})
  const [presence, setPresence] = useState<{ uid: string; username: string }[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({})
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({})
  const localStreamRef = useRef<MediaStream | null>(null)
  const iceServersRef = useRef<RTCIceServer[]>([{ urls: 'stun:stun.l.google.com:19302' }])

  // Lets other members see "N in call" without joining themselves.
  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const { peers: list } = await api.get<{ peers: { uid: string; username: string }[] }>(
          `/calls/${roomId}/presence`,
        )
        if (!cancelled) setPresence(list)
      } catch {
        /* ignore — presence is best-effort */
      }
    }
    void poll()
    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [roomId])

  function send(data: object) {
    wsRef.current?.send(JSON.stringify(data))
  }

  function closePeer(uid: string) {
    pcsRef.current[uid]?.close()
    delete pcsRef.current[uid]
    delete pendingCandidatesRef.current[uid]
    setPeers((prev) => {
      const next = { ...prev }
      delete next[uid]
      return next
    })
  }

  function makePeerConnection(uid: string, username: string) {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })
    pcsRef.current[uid] = pc

    for (const track of localStreamRef.current?.getTracks() ?? []) {
      pc.addTrack(track, localStreamRef.current!)
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) send({ type: 'ice-candidate', to: uid, candidate: e.candidate.toJSON() })
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        toast.error(`Couldn't connect to ${username} — their network may be blocking the connection.`)
      }
    }
    pc.ontrack = (e) => {
      setPeers((prev) => {
        const existing: RemotePeer = prev[uid] ?? { uid, username, micMuted: false, stream: null }
        return { ...prev, [uid]: { ...existing, stream: e.streams[0] ?? null } }
      })
    }

    setPeers((prev) => ({ ...prev, [uid]: prev[uid] ?? { uid, username, stream: null, micMuted: false } }))
    return pc
  }

  async function handleSignal(msg: SignalMessage) {
    if (msg.type === 'peers') {
      for (const p of msg.peers) {
        const pc = makePeerConnection(p.uid, p.username)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        send({ type: 'offer', to: p.uid, sdp: offer })
      }
      return
    }
    if (msg.type === 'peer-joined') {
      setPeers((prev) => ({ ...prev, [msg.uid]: prev[msg.uid] ?? { uid: msg.uid, username: msg.username, stream: null, micMuted: false } }))
      return
    }
    if (msg.type === 'peer-left') {
      closePeer(msg.uid)
      return
    }
    if (msg.type === 'offer') {
      const pc = pcsRef.current[msg.from] ?? makePeerConnection(msg.from, msg.from)
      await pc.setRemoteDescription(msg.sdp)
      for (const c of pendingCandidatesRef.current[msg.from] ?? []) await pc.addIceCandidate(c)
      pendingCandidatesRef.current[msg.from] = []
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      send({ type: 'answer', to: msg.from, sdp: answer })
      return
    }
    if (msg.type === 'answer') {
      const pc = pcsRef.current[msg.from]
      if (pc) await pc.setRemoteDescription(msg.sdp)
      return
    }
    if (msg.type === 'ice-candidate') {
      const pc = pcsRef.current[msg.from]
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(msg.candidate)
      } else {
        pendingCandidatesRef.current[msg.from] = [...(pendingCandidatesRef.current[msg.from] ?? []), msg.candidate]
      }
      return
    }
    if (msg.type === 'mic-state') {
      setPeers((prev) => (prev[msg.from] ? { ...prev, [msg.from]: { ...prev[msg.from], micMuted: msg.muted } } : prev))
    }
  }

  const leave = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    for (const uid of Object.keys(pcsRef.current)) closePeer(uid)
    for (const track of localStreamRef.current?.getTracks() ?? []) track.stop()
    localStreamRef.current = null
    setLocalStream(null)
    setPeers({})
    setJoined(false)
    setConnecting(false)
  }, [])

  const join = useCallback(async () => {
    setConnecting(true)
    try {
      const { iceServers } = await api.get<{ iceServers: RTCIceServer[] }>('/calls/ice-servers')
      iceServersRef.current = iceServers

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        setCamOn(false)
      }
      localStreamRef.current = stream
      setLocalStream(stream)

      const token = await auth.currentUser?.getIdToken()
      const ws = new WebSocket(`${WS_URL}/ws/calls?roomId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token ?? '')}`)
      wsRef.current = ws
      // Attached before the socket is confirmed open so no early message
      // (e.g. the initial peer list) can arrive and be silently dropped.
      ws.onmessage = (e) => void handleSignal(JSON.parse(e.data) as SignalMessage)
      ws.onclose = () => leave()

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve()
        ws.onerror = () => reject(new Error('Could not connect to the call.'))
      })

      setJoined(true)
    } catch (err) {
      leave()
      throw err
    } finally {
      setConnecting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  function toggleMic() {
    const next = !micOn
    setMicOn(next)
    for (const track of localStreamRef.current?.getAudioTracks() ?? []) track.enabled = next
    send({ type: 'mic-state', muted: !next })
  }

  function toggleCam() {
    const next = !camOn
    setCamOn(next)
    for (const track of localStreamRef.current?.getVideoTracks() ?? []) track.enabled = next
  }

  useEffect(() => () => leave(), [leave])

  return {
    joined,
    connecting,
    micOn,
    camOn,
    localStream,
    peers: Object.values(peers),
    presence,
    join,
    leave,
    toggleMic,
    toggleCam,
  }
}
