import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  tone?: 'primary' | 'gold' | 'default'
  className?: string
}

export function StatCard({ icon: Icon, label, value, tone = 'default', className }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            tone === 'primary' && 'bg-primary/15 text-primary',
            tone === 'gold' && 'bg-secondary/15 text-secondary',
            tone === 'default' && 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

export function AdminStatCard({ icon: Icon, label, value, tone = 'default', className }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      <div
        className={cn(
          'mb-3 flex size-10 items-center justify-center rounded-xl',
          tone === 'primary' && 'bg-primary/15 text-primary',
          tone === 'gold' && 'bg-secondary/15 text-secondary',
          tone === 'default' && 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
