import {
  Bell,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/rooms', label: 'Community', icon: Users },
  { to: '/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/matches', label: 'Matches', icon: Swords },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/hall-of-fame', label: 'Hall of Fame', icon: ShieldCheck },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar() {
  const { profile, logout } = useAuth()
  if (!profile) return null

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <img src="/logo.jpg" alt="Legendary Arena" className="size-9 rounded-xl object-cover" />
        <div>
          <p className="text-sm font-bold leading-none tracking-tight">LEGENDARY ARENA</p>
          <p className="text-[11px] text-muted-foreground">One community. One champion.</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isActive && 'bg-primary/15 text-primary hover:bg-primary/15 hover:text-primary',
              )
            }
          >
            <Icon className="size-4.5" />
            {label}
          </NavLink>
        ))}

        {profile.role === 'admin' && (
          <>
            <div className="my-3 h-px bg-border" />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-secondary/80 transition-colors hover:bg-secondary/10 hover:text-secondary',
                  isActive && 'bg-secondary/15 text-secondary',
                )
              }
            >
              <ShieldCheck className="size-4.5" />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to={`/profile/${profile.uid}`}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent"
        >
          <PlayerAvatar src={profile.avatarUrl} name={profile.username} size="sm" online={profile.online} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile.username}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </NavLink>
        <div className="mt-1 flex items-center gap-1">
          <NavLink
            to="/settings"
            className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Settings className="size-4" />
            Settings
          </NavLink>
          <button
            onClick={() => void logout()}
            className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
