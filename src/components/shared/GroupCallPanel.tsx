import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useGroupCall } from '@/hooks/useGroupCall'
import { usePlayer } from '@/store/playersStore'

const MAX_PEERS_PER_ROOM = 4

function VideoTile({
  stream,
  muted,
  name,
  avatarUrl,
  micMuted,
  videoOff,
}: {
  stream: MediaStream | null
  muted: boolean
  name: string
  avatarUrl?: string
  micMuted: boolean
  videoOff?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasVideo = Boolean(stream?.getVideoTracks().some((t) => t.enabled)) && !videoOff

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
      {hasVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <PlayerAvatar src={avatarUrl} name={name} size="xl" />
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white">
        {micMuted ? <MicOff className="size-3.5 text-destructive" /> : <Mic className="size-3.5" />}
        {name}
      </div>
    </div>
  )
}

function CallPeerTile({ uid, username, stream, micMuted }: { uid: string; username: string; stream: MediaStream | null; micMuted: boolean }) {
  const player = usePlayer(uid)
  return (
    <VideoTile
      stream={stream}
      muted={false}
      name={player?.username ?? username}
      avatarUrl={player?.avatarUrl}
      micMuted={micMuted}
    />
  )
}

export function GroupCallPanel({ roomId }: { roomId: string }) {
  const { profile } = useAuth()
  const { joined, connecting, micOn, camOn, localStream, peers, presence, join, leave, toggleMic, toggleCam } =
    useGroupCall(roomId)

  async function handleJoin() {
    try {
      await join()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not join the call. Check your camera/mic permissions.')
    }
  }

  if (!profile) return null

  if (!joined) {
    const inCall = presence.filter((p) => p.uid !== profile.uid)
    const full = presence.length >= MAX_PEERS_PER_ROOM

    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        {inCall.length > 0 ? (
          <>
            <div className="flex -space-x-3">
              {inCall.map((p) => (
                <PlayerAvatarById key={p.uid} uid={p.uid} fallbackName={p.username} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {inCall.map((p) => p.username).join(', ')} {inCall.length === 1 ? 'is' : 'are'} in a call right now.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No one's in a call right now. Start one — voice and video, up to 4 people.</p>
        )}

        {full ? (
          <p className="text-sm font-medium text-destructive">This call is full (max {MAX_PEERS_PER_ROOM}).</p>
        ) : (
          <Button onClick={() => void handleJoin()} disabled={connecting}>
            {connecting ? 'Connecting…' : inCall.length > 0 ? 'Join Call' : 'Start Call'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <VideoTile stream={localStream} muted name={`${profile.username} (You)`} avatarUrl={profile.avatarUrl} micMuted={!micOn} videoOff={!camOn} />
        {peers.map((p) => (
          <CallPeerTile key={p.uid} uid={p.uid} username={p.username} stream={p.stream} micMuted={p.micMuted} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant={micOn ? 'outline' : 'destructive'} size="icon" onClick={toggleMic} title={micOn ? 'Mute mic' : 'Unmute mic'}>
          {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        </Button>
        <Button variant={camOn ? 'outline' : 'destructive'} size="icon" onClick={toggleCam} title={camOn ? 'Turn camera off' : 'Turn camera on'}>
          {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
        </Button>
        <Button variant="destructive" size="icon" onClick={leave} title="Leave call">
          <PhoneOff className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function PlayerAvatarById({ uid, fallbackName }: { uid: string; fallbackName: string }) {
  const player = usePlayer(uid)
  return (
    <PlayerAvatar
      src={player?.avatarUrl}
      name={player?.username ?? fallbackName}
      size="md"
      className="ring-2 ring-background"
    />
  )
}
