import { Megaphone, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MessageBubble } from '@/components/shared/MessageBubble'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useRoomMessages } from '@/hooks/useRoomMessages'
import { sendMessage } from '@/lib/chat'

export function ChatPanel({ roomId, isAdmin }: { roomId: string; isAdmin: boolean }) {
  const { profile } = useAuth()
  const { messages, loading } = useRoomMessages(roomId)
  const [text, setText] = useState('')
  const [asAnnouncement, setAsAnnouncement] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  async function handleSend() {
    if (!text.trim() || !profile) return
    await sendMessage(roomId, profile.uid, text.trim(), null, asAnnouncement)
    setText('')
    setAsAnnouncement(false)
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-2xl border border-border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {!loading && messages.length === 0 && (
          <EmptyState
            icon={Megaphone}
            title="No messages yet"
            description="Say hello to get the conversation going."
          />
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} roomId={roomId} isAdmin={isAdmin} />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setAsAnnouncement((v) => !v)}
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              asAnnouncement ? 'border-secondary/50 bg-secondary/15 text-secondary' : 'border-border text-muted-foreground'
            }`}
            title="Send as announcement"
          >
            <Megaphone className="size-4" />
          </button>
        )}
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSend()
          }}
          placeholder={asAnnouncement ? 'Write an announcement…' : 'Type a message…'}
        />
        <Button size="icon" onClick={() => void handleSend()} disabled={!text.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
