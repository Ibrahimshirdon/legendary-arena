import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  Trophy,
  UserCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn, timeAgo } from '@/lib/utils'
import type { AppNotification, NotificationType } from '@/types'

const iconMap: Record<NotificationType, typeof Bell> = {
  tournament_open: Trophy,
  registration_open: Trophy,
  accepted: UserCheck,
  match_scheduled: CalendarCheck,
  result_submitted: ShieldAlert,
  result_confirmed: CheckCircle2,
  tournament_starting: Trophy,
  tournament_completed: Trophy,
  request_approved: CheckCircle2,
  request_rejected: ShieldAlert,
  request_postponed: CalendarCheck,
  announcement: MessageSquare,
  room_joined: UserCheck,
}

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification
  onRead: (id: string) => void
}) {
  const Icon = iconMap[notification.type] ?? Bell

  const content = (
    <div
      className={cn(
        'flex gap-3 rounded-xl border border-border p-4 transition-colors',
        notification.read ? 'bg-card/40' : 'bg-card',
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{notification.title}</p>
          {!notification.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  )

  return (
    <button onClick={() => onRead(notification.id)} className="block w-full text-left">
      {notification.link ? <Link to={notification.link}>{content}</Link> : content}
    </button>
  )
}
