import { Frown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Frown className="size-10 text-primary" />
      <h1 className="text-2xl font-bold">Offside — page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        That page doesn't exist in this arena. Let's get you back to the pitch.
      </p>
      <Button asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
