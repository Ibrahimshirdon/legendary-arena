import { Megaphone, Smile, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { deleteMessage, toggleReaction } from '@/lib/chat'
import { cn, formatTime } from '@/lib/utils'
import { usePlayer } from '@/store/playersStore'
import type { ChatMessage } from '@/types'

const QUICK_EMOJIS = ['🔥', '😂', '⚽', '👏', '😮']

export function MessageBubble({
  message,
  roomId,
  isAdmin,
}: {
  message: ChatMessage
  roomId: string
  isAdmin: boolean
}) {
  const { profile } = useAuth()
  const sender = usePlayer(message.senderId)
  const [showPicker, setShowPicker] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const isMe = profile?.uid === message.senderId
  const canDelete = isMe || isAdmin

  if (!profile) return null

  return (
    <div className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}>
      <PlayerAvatar src={sender?.avatarUrl} name={sender?.username ?? '—'} size="sm" />
      <div className={cn('max-w-[75%] space-y-1', isMe && 'items-end text-right')}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{sender?.username ?? 'Member'}</span>
          <span className="text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
        </div>

        <div className="group relative inline-block">
          <div
            className={cn(
              'space-y-2 rounded-2xl px-4 py-2.5 text-sm',
              message.isAnnouncement
                ? 'border border-secondary/30 bg-secondary/10 text-secondary-foreground'
                : isMe
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              message.imageUrl && !message.deleted && 'p-1.5',
            )}
          >
            {message.isAnnouncement && (
              <div className="flex items-center gap-1.5 px-2.5 pt-1.5 text-xs font-bold text-secondary">
                <Megaphone className="size-3.5" /> Announcement
              </div>
            )}
            {message.deleted ? (
              <span className="italic opacity-60">Message deleted</span>
            ) : (
              <>
                {message.imageUrl && (
                  <button type="button" onClick={() => setViewerOpen(true)} className="block overflow-hidden rounded-xl">
                    <img src={message.imageUrl} alt="Shared" className="max-h-64 w-auto max-w-full object-cover" />
                  </button>
                )}
                {message.text && <p className={cn(message.imageUrl && 'px-2.5 pb-1.5')}>{message.text}</p>}
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

        {Object.entries(message.reactions).some(([, uids]) => uids.length > 0) && (
          <div className={cn('flex flex-wrap gap-1', isMe && 'justify-end')}>
            {Object.entries(message.reactions)
              .filter(([, uids]) => uids.length > 0)
              .map(([emoji, uids]) => {
                const active = uids.includes(profile.uid)
                return (
                  <button
                    key={emoji}
                    onClick={() => void toggleReaction(roomId, message.id, emoji, profile.uid, active)}
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs',
                      active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                    )}
                  >
                    {emoji} {uids.length}
                  </button>
                )
              })}
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
    </div>
  )
}
