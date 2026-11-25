import { Trophy } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background pitch-pattern">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-card p-12 lg:flex">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Legendary Arena" className="size-10 rounded-xl object-cover" />
          <span className="text-lg font-bold tracking-tight">LEGENDARY ARENA</span>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Trophy className="size-3.5" /> Season 01 is live
          </div>
          <h1 className="max-w-md text-4xl font-black leading-tight tracking-tight">
            One community. One champion. <span className="text-primary">Endless rivalries.</span>
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tournaments, live results, trophies, and trash talk — all in one private arena built for
            your crew.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Private community · Invite only · Est. {new Date().getFullYear()}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/logo.jpg" alt="Legendary Arena" className="size-9 rounded-xl object-cover" />
            <span className="text-base font-bold tracking-tight">LEGENDARY ARENA</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
