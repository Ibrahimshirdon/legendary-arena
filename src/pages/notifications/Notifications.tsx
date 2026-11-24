import { Bell, CheckCheck } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { NotificationItem } from '@/components/shared/NotificationItem'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { api } from '@/lib/api'

export default function Notifications() {
  const { profile } = useAuth()
  const { notifications, loading, unreadCount, refetch } = useNotifications(profile?.uid)

  if (!profile) return null

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`)
    void refetch()
  }

  async function markAllRead() {
    await api.patch('/notifications/mark-all-read')
    void refetch()
  }

  return (
    <div>
      <Topbar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 ? (
            <Button size="sm" variant="outline" onClick={() => void markAllRead()}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-2 p-4 lg:p-8">
        {loading ? null : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" description="We'll let you know when something happens." />
        ) : (
          notifications.map((n) => <NotificationItem key={n.id} notification={n} onRead={markRead} />)
        )}
      </div>
    </div>
  )
}
