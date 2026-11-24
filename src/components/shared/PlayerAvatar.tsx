import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, initials } from '@/lib/utils'

const sizeMap = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
}

interface PlayerAvatarProps {
  src?: string
  name: string
  size?: keyof typeof sizeMap
  online?: boolean
  className?: string
  ring?: boolean
}

export function PlayerAvatar({ src, name, size = 'md', online, className, ring }: PlayerAvatarProps) {
  return (
    <div className="relative inline-block shrink-0">
      <Avatar className={cn(sizeMap[size], ring && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background', className)}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block size-2.5 rounded-full border-2 border-background',
            online ? 'bg-success' : 'bg-muted-foreground',
          )}
        />
      )}
    </div>
  )
}
