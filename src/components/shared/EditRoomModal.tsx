import { zodResolver } from '@hookform/resolvers/zod'
import { ImageUp, Loader2, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { editRoom } from '@/lib/rooms'
import { uploadRoomImage } from '@/lib/storage'
import type { Room } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Give the room a name'),
  description: z.string().min(1, 'Add a short description'),
})

type FormValues = z.infer<typeof schema>

export function EditRoomModal({ room }: { room: Room }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bannerUrl, setBannerUrl] = useState(room.bannerUrl)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: room.name, description: room.description },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      let finalBannerUrl = bannerUrl
      if (bannerFile) {
        finalBannerUrl = await uploadRoomImage(bannerFile)
      }
      await editRoom(room.id, { name: values.name, description: values.description, bannerUrl: finalBannerUrl })
      toast.success('Room updated!')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update room.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="size-4" /> Edit Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit room</DialogTitle>
          <DialogDescription>Update the room's name, description, and photo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Room photo</Label>
            <div
              className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
              style={
                bannerUrl
                  ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : undefined
              }
            >
              {!bannerUrl && <ImageUp className="size-6 text-muted-foreground" />}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <ImageUp className="size-3.5" />
              {bannerUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setBannerFile(file)
                setBannerUrl(URL.createObjectURL(file))
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="roomName">Room name</Label>
            <Input id="roomName" placeholder="The Weekend Warriors" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roomDescription">Description</Label>
            <Textarea id="roomDescription" placeholder="What's this room about?" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
