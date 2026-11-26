import {
  Bell,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/rooms', label: 'Community', icon: Users },
  { to: '/tournaments', label: 'Cups', icon: Trophy },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/notifications', label: 'Alerts', icon: Bell },
]

// Rounds out everything the 5-slot bottom bar has no room for.
const moreItems = [
  { to: '/matches', label: 'Matches', icon: Swords },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/hall-of-fame', label: 'Hall of Fame', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-border bg-card/95 px-2 py-2 backdrop-blur lg:hidden">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground',
              isActive && 'text-primary',
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground outline-none">
          <MoreHorizontal className="size-5" />
          More
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={12}>
          {moreItems.map(({ to, label, icon: Icon }) => (
            <DropdownMenuItem key={to} onClick={() => navigate(to)}>
              <Icon className="size-4" /> {label}
            </DropdownMenuItem>
          ))}
          {profile?.role === 'admin' && (
            <DropdownMenuItem onClick={() => navigate('/admin')}>
              <ShieldCheck className="size-4" /> Admin Panel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
