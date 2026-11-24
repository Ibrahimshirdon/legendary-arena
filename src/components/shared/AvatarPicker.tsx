import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { dicebearAvatar } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface AvatarPickerProps {
  seedBase: string
  value: string
  onChange: (url: string) => void
  onFileSelected: (file: File) => void
  uploading?: boolean
}

export function AvatarPicker({ seedBase, value, onChange, onFileSelected, uploading }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [customPreview, setCustomPreview] = useState<string | null>(null)

  const seeds = ['a', 'b', 'c', 'd', 'e'].map((s) => `${seedBase || 'player'}-${s}`)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-16 ring-2 ring-primary/40 ring-offset-2 ring-offset-background">
          <AvatarImage src={customPreview ?? value} alt="avatar preview" />
        </Avatar>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="size-3.5" />
            {uploading ? 'Uploading…' : 'Upload photo'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setCustomPreview(URL.createObjectURL(file))
              onFileSelected(file)
            }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {seeds.map((seed) => {
          const url = dicebearAvatar(seed)
          const active = value === url && !customPreview
          return (
            <button
              key={seed}
              type="button"
              onClick={() => {
                setCustomPreview(null)
                onChange(url)
              }}
              className={cn(
                'size-11 overflow-hidden rounded-full border-2 border-transparent transition-all hover:border-primary/60',
                active && 'border-primary',
              )}
            >
              <img src={url} alt="avatar option" className="size-full object-cover" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
