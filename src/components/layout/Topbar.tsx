import { ArrowLeft, Bell, LogOut, Settings, ShieldCheck, User as UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { InstallTopbarButton } from '@/components/shared/InstallTopbarButton'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'

export function Topbar({
  title,
  subtitle,
  actions,
  showBack,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  showBack?: boolean
}) {
  const { profile, logout } = useAuth()
  const { unreadCount } = useNotifications(profile?.uid)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3.5 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 shrink-0"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight lg:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground lg:text-sm">{subtitle}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions}

        <InstallTopbarButton />

        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden">
              <PlayerAvatar src={profile.avatarUrl} name={profile.username} size="sm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/profile/${profile.uid}`)}>
                <UserIcon className="size-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="size-4" /> Settings
              </DropdownMenuItem>
              {profile.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <ShieldCheck className="size-4" /> Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void logout()} className="text-destructive focus:text-destructive">
                <LogOut className="size-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
