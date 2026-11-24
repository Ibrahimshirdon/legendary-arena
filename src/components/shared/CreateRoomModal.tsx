import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
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
import { useAuth } from '@/context/AuthContext'
import { createRoom } from '@/lib/rooms'

const schema = z.object({
  name: z.string().min(2, 'Give the room a name'),
  description: z.string().min(1, 'Add a short description'),
})

type FormValues = z.infer<typeof schema>

export function CreateRoomModal() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    if (!profile) return
    setSubmitting(true)
    try {
      await createRoom(values.name, values.description, '', profile.uid)
      toast.success('Room created!')
      reset()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create room.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Create Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a community room</DialogTitle>
          <DialogDescription>A fresh space for a crew to chat, run tournaments, and compete.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
