import { ImagePlus, Loader2, Megaphone, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { MessageBubble } from '@/components/shared/MessageBubble'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useRoomMessages } from '@/hooks/useRoomMessages'
import { sendMessage } from '@/lib/chat'
import { uploadChatImage } from '@/lib/storage'

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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handlePickImage(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processingImage}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
          title="Attach an image"
        >
          {processingImage ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </button>

        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSend()
          }}
          placeholder={asAnnouncement ? 'Write an announcement…' : 'Type a message…'}
        />
        <Button size="icon" onClick={() => void handleSend()} disabled={sending || (!text.trim() && !pendingImage)}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
