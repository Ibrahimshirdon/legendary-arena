import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { refetchAppStores } from '@/store/appStores'
import type { ReactNode } from 'react'
import type { Room, TournamentFormat, TournamentRequest } from '@/types'

const schema = z.object({
  roomId: z.string().min(1, 'Select a room'),
  name: z.string().min(3, 'Give your tournament a name'),
  format: z.enum(['knockout', 'league', 'group_knockout', 'friendly']),
  numPlayers: z.number().min(2).max(64),
  description: z.string().min(1, 'Add a short description'),
  proposedDate: z.string().min(1, 'Pick a date'),
  message: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function TournamentRequestModal({ rooms, trigger }: { rooms: Room[]; trigger: ReactNode }) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { format: 'knockout', numPlayers: 8, roomId: rooms[0]?.id ?? '' },
  })

  async function onSubmit(values: FormValues) {
    if (!profile) return
    setSubmitting(true)
    try {
      await api.post<TournamentRequest>('/tournament-requests', {
        roomId: values.roomId,
        name: values.name,
        format: values.format,
        numPlayers: values.numPlayers,
        description: values.description,
        proposedDate: new Date(values.proposedDate).getTime(),
        message: values.message ?? '',
      })
      refetchAppStores()

      toast.success('Request sent to the admin!')
      reset()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a tournament</DialogTitle>
          <DialogDescription>Pitch it to the admin — they'll review and set it live.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Room</Label>
            <Select defaultValue={rooms[0]?.id} onValueChange={(v) => setValue('roomId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId && <p className="text-xs text-destructive">{errors.roomId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Tournament name</Label>
            <Input id="name" placeholder="Legendary Winter Cup" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select
                defaultValue="knockout"
                onValueChange={(v) => setValue('format', v as TournamentFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="league">League</SelectItem>
                  <SelectItem value="group_knockout">Group + Knockout</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numPlayers">Players</Label>
              <Input id="numPlayers" type="number" min={2} max={64} {...register('numPlayers', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proposedDate">Proposed date</Label>
            <Input id="proposedDate" type="date" {...register('proposedDate')} />
            {errors.proposedDate && <p className="text-xs text-destructive">{errors.proposedDate.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="What's this tournament about?" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message to admin (optional)</Label>
            <Textarea id="message" placeholder="Anything else to add?" {...register('message')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || watch('roomId') === ''}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
