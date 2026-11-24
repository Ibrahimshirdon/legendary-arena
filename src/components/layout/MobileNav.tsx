import { Bell, LayoutDashboard, MessageSquare, Trophy, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/rooms', label: 'Community', icon: Users },
  { to: '/tournaments', label: 'Cups', icon: Trophy },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/notifications', label: 'Alerts', icon: Bell },
]

export function MobileNav() {
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
    </nav>
  )
}
