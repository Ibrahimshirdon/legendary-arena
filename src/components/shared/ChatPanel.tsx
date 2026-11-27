import { ImagePlus, Loader2, Megaphone, Send, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { MessageBubble } from '@/components/shared/MessageBubble'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useRoomMessages } from '@/hooks/useRoomMessages'
import { sendMessage } from '@/lib/chat'
import { uploadChatImage } from '@/lib/storage'
import { cn, dayLabel, isSameDay } from '@/lib/utils'
import type { ChatMessage } from '@/types'

const GROUP_WINDOW_MS = 5 * 60 * 1000

type RenderItem = { type: 'date'; key: string; label: string } | { type: 'message'; key: string; message: ChatMessage; showMeta: boolean }

function buildRenderItems(messages: ChatMessage[]): RenderItem[] {
  const items: RenderItem[] = []
  messages.forEach((m, i) => {
    const prev = messages[i - 1]
    if (!prev || !isSameDay(prev.createdAt, m.createdAt)) {
      items.push({ type: 'date', key: `date-${m.id}`, label: dayLabel(m.createdAt) })
    }
    const grouped =
      prev &&
      prev.senderId === m.senderId &&
      !prev.isAnnouncement &&
      !m.isAnnouncement &&
      isSameDay(prev.createdAt, m.createdAt) &&
      m.createdAt - prev.createdAt < GROUP_WINDOW_MS
    items.push({ type: 'message', key: m.id, message: m, showMeta: !grouped })
  })
  return items
}

export function ChatPanel({ roomId, isAdmin }: { roomId: string; isAdmin: boolean }) {
  const { profile } = useAuth()
  const { messages, loading } = useRoomMessages(roomId)
  const [text, setText] = useState('')
  const [asAnnouncement, setAsAnnouncement] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [processingImage, setProcessingImage] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const renderItems = useMemo(() => buildRenderItems(messages), [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  async function handlePickImage(file: File | undefined) {
    if (!file) return
    setProcessingImage(true)
    try {
      setPendingImage(await uploadChatImage(file))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not process that image.')
    } finally {
      setProcessingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSend() {
    if ((!text.trim() && !pendingImage) || !profile) return
    setSending(true)
    try {
      await sendMessage(roomId, profile.uid, text.trim(), null, asAnnouncement, pendingImage)
      setText('')
      setPendingImage(null)
      setAsAnnouncement(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:h-[calc(100dvh-13rem)]">
      <div ref={scrollRef} className="pitch-pattern flex-1 space-y-1.5 overflow-y-auto bg-background/40 p-4">
        {!loading && messages.length === 0 && (
          <EmptyState
            icon={Megaphone}
            title="No messages yet"
            description="Say hello to get the conversation going."
          />
        )}
        {renderItems.map((item) =>
          item.type === 'date' ? (
            <div key={item.key} className="flex justify-center py-2">
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          ) : (
            <MessageBubble key={item.key} message={item.message} roomId={roomId} isAdmin={isAdmin} showMeta={item.showMeta} />
          ),
        )}
      </div>

      {pendingImage && (
        <div className="flex items-center gap-2 border-t border-border px-3 pt-3">
          <div className="relative">
            <img src={pendingImage} alt="To send" className="h-16 w-16 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">Image ready to send</span>
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border bg-card p-3">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setAsAnnouncement((v) => !v)}
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors',
              asAnnouncement ? 'border-secondary/50 bg-secondary/15 text-secondary' : 'border-border text-muted-foreground',
            )}
            title="Send as announcement"
          >
            <Megaphone className="size-4" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handlePickImage(e.target.files?.[0])}
        />

        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-muted/40 pl-1.5 pr-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={processingImage}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            title="Attach an image"
          >
            {processingImage ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSend()
            }}
            placeholder={asAnnouncement ? 'Write an announcement…' : 'Type a message…'}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Button
          size="icon"
          className="shrink-0 rounded-full"
          onClick={() => void handleSend()}
          disabled={sending || (!text.trim() && !pendingImage)}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
