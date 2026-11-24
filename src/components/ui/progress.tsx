import * as ProgressPrimitive from '@radix-ui/react-progress'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full flex-1 bg-primary transition-all', indicatorClassName)}
        style={{ width: `${value ?? 0}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
