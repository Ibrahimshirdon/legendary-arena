import { api } from '@/lib/api'
import { refetchAppStores } from '@/store/appStores'
import type { Room } from '@/types'

export async function createRoom(name: string, description: string, bannerUrl: string, _ownerId: string) {
  const room = await api.post<Room>('/rooms', { name, description, bannerUrl })
  refetchAppStores()
  return room
}

export async function joinByInviteCode(_uid: string, code: string) {
  const room = await api.post<Room>('/rooms/join-by-code', { code })
  refetchAppStores()
  return room
}

export async function requestToJoin(room: Room, _uid: string) {
  await api.post(`/rooms/${room.id}/request-join`)
  refetchAppStores()
}

export async function approveJoinRequest(room: Room, uid: string) {
  await api.post(`/rooms/${room.id}/approve/${uid}`)
  refetchAppStores()
}

export async function rejectJoinRequest(room: Room, uid: string) {
  await api.post(`/rooms/${room.id}/reject/${uid}`)
  refetchAppStores()
}

export async function deleteRoom(room: Room) {
  await api.delete(`/rooms/${room.id}`)
  refetchAppStores()
}

export async function editRoom(
  roomId: string,
  updates: { name?: string; description?: string; bannerUrl?: string },
) {
  const room = await api.patch<Room>(`/rooms/${roomId}`, updates)
  refetchAppStores()
  return room
}
