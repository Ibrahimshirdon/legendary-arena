import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useRoomsStore } from '@/store/appStores'

export default function ChatRedirect() {
  const { profile } = useAuth()
  const { items: rooms, loading } = useRoomsStore()

  if (!profile || loading) return null

  const myRoom = rooms.find((r) => r.memberIds.includes(profile.uid))
  return <Navigate to={myRoom ? `/rooms/${myRoom.id}?tab=chat` : '/rooms'} replace />
}
