import { api } from '@/lib/api'
import { usePlayersStore } from '@/store/playersStore'
import type { AccountStatus, UserRole } from '@/types'

export async function setUserStatus(uid: string, status: AccountStatus) {
  await api.patch(`/users/${uid}/status`, { status })
  void usePlayersStore.getState().refetch()
}

export async function setUserRole(uid: string, role: UserRole) {
  await api.patch(`/users/${uid}/role`, { role })
  void usePlayersStore.getState().refetch()
}
