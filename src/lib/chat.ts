import { api } from '@/lib/api'

export async function sendMessage(
  roomId: string,
  _senderId: string,
  text: string,
  replyToId?: string | null,
  isAnnouncement = false,
  imageUrl?: string | null,
) {
  await api.post(`/rooms/${roomId}/messages`, {
    text,
    imageUrl: imageUrl ?? null,
    replyToId: replyToId ?? null,
    isAnnouncement,
  })
}

export async function toggleReaction(
  roomId: string,
  messageId: string,
  emoji: string,
  _uid: string,
  _active: boolean,
) {
  await api.post(`/rooms/${roomId}/messages/${messageId}/reactions`, { emoji })
}

export async function deleteMessage(roomId: string, messageId: string) {
  await api.patch(`/rooms/${roomId}/messages/${messageId}/delete`)
}
