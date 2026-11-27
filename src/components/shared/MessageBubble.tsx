import { Info, Megaphone, Smile, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { deleteMessage, toggleReaction } from '@/lib/chat'
import { cn, formatTime } from '@/lib/utils'
import { usePlayer, usePlayersStore } from '@/store/playersStore'
import type { ChatMessage } from '@/types'

const QUICK_EMOJIS = ['🔥', '😂', '⚽', '👏', '😮']

export function MessageBubble({
  message,
  roomId,
  isAdmin,
  showMeta = true,
}: {
  message: ChatMessage
  roomId: string
  isAdmin: boolean
  /** False for messages right after one from the same sender — WhatsApp-style
   * grouping: no repeated avatar/name, just a tighter stack of bubbles. */
  showMeta?: boolean
}) {
  const { profile } = useAuth()
  const sender = usePlayer(message.senderId)
  const players = usePlayersStore((s) => s.players)
  const [showPicker, setShowPicker] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [reactorsOpen, setReactorsOpen] = useState(false)
  const isMe = profile?.uid === message.senderId
  const canDelete = isMe || isAdmin
  const reactionEntries = Object.entries(message.reactions).filter(([, uids]) => uids.length > 0)
  const namesFor = (uids: string[]) => uids.map((uid) => players[uid]?.username ?? 'Member').join(', ')
  const time = formatTime(message.createdAt)
  const imageOnly = message.imageUrl && !message.text

  if (!profile) return null

  return (
    <div className={cn('flex gap-2.5', isMe && 'flex-row-reverse', !showMeta && 'mt-0.5')}>
      <div className="w-8 shrink-0">
        {showMeta && <PlayerAvatar src={sender?.avatarUrl} name={sender?.username ?? '—'} size="sm" />}
      </div>
      <div className={cn('max-w-[75%] space-y-1', isMe && 'items-end text-right')}>
        {showMeta && !isMe && (
          <span className="text-xs font-semibold text-muted-foreground">{sender?.username ?? 'Member'}</span>
        )}

        <div className="group relative inline-block">
          <div
            className={cn(
              'relative space-y-1 rounded-2xl px-3 py-2 text-sm shadow-sm',
              message.isAnnouncement
                ? 'border border-secondary/30 bg-secondary/10 text-secondary-foreground'
                : isMe
                  ? 'rounded-tr-sm bg-primary text-primary-foreground'
                  : 'rounded-tl-sm bg-muted text-foreground',
              message.imageUrl && !message.deleted && 'p-1.5',
            )}
          >
            {message.isAnnouncement && (
              <div className="flex items-center gap-1.5 px-1.5 pt-1 text-xs font-bold text-secondary">
                <Megaphone className="size-3.5" /> Announcement
              </div>
            )}
            {message.deleted ? (
              <span className="italic opacity-60">Message deleted</span>
            ) : (
              <>
                {message.imageUrl && (
                  <button type="button" onClick={() => setViewerOpen(true)} className="relative block overflow-hidden rounded-xl">
                    <img src={message.imageUrl} alt="Shared" className="max-h-64 w-auto max-w-full object-cover" />
                    {imageOnly && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                        {time}
                      </span>
                    )}
                  </button>
                )}
                {message.text && (
                  <p className={cn('whitespace-pre-wrap break-words', message.imageUrl && 'px-1.5 pb-0.5')}>
                    {message.text}
                    <span
                      className={cn(
                        'ml-2 inline-block align-bottom text-[10px] opacity-70',
                        isMe ? 'text-primary-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {time}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>

          {!message.deleted && (
            <div
              className={cn(
                'absolute -bottom-3 flex items-center gap-1 opacity-70 transition-opacity hover:opacity-100 group-hover:opacity-100',
                isMe ? 'right-0' : 'left-0',
              )}
            >
              <button
                onClick={() => setShowPicker((v) => !v)}
                className="flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary"
              >
                <Smile className="size-3.5" />
              </button>
              {canDelete && (
                <button
                  onClick={() => void deleteMessage(roomId, message.id)}
                  className="flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {showPicker && (
            <div
              className={cn(
                'absolute top-full z-10 mt-2 flex gap-1 rounded-xl border border-border bg-popover p-1.5 shadow-xl',
                isMe ? 'right-0' : 'left-0',
              )}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    const active = message.reactions[emoji]?.includes(profile.uid) ?? false
                    void toggleReaction(roomId, message.id, emoji, profile.uid, active)
                    setShowPicker(false)
                  }}
                  className="rounded-lg p-1.5 text-base hover:bg-accent"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {reactionEntries.length > 0 && (
          <div className={cn('flex flex-wrap items-center gap-1', isMe && 'justify-end')}>
            {reactionEntries.map(([emoji, uids]) => {
              const active = uids.includes(profile.uid)
              return (
                <button
                  key={emoji}
                  onClick={() => void toggleReaction(roomId, message.id, emoji, profile.uid, active)}
                  title={namesFor(uids)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs',
                    active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                  )}
                >
                  {emoji} {uids.length}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setReactorsOpen(true)}
              aria-label="See who reacted"
              className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
            >
              <Info className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {message.imageUrl && (
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-2xl overflow-visible border-none bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">Shared image</DialogTitle>
            <img src={message.imageUrl} alt="Shared" className="mx-auto max-h-[80vh] w-auto max-w-full rounded-2xl" />
          </DialogContent>
        </Dialog>
      )}

      {reactionEntries.length > 0 && (
        <Dialog open={reactorsOpen} onOpenChange={setReactorsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reactions</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {reactionEntries.map(([emoji, uids]) => (
                <div key={emoji} className="flex items-start gap-3">
                  <span className="text-xl leading-none">{emoji}</span>
                  <p className="text-sm text-muted-foreground">{namesFor(uids)}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
