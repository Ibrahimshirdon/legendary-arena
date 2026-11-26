import { CircleHelp, MessageCircle, PhoneCall, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const WHATSAPP_NUMBER = '252906251592'
const PHONE_NUMBER = '0906251592'

const STEPS = [
  'Tap "Create an account" below the sign-in form.',
  'Enter your name, pick a username, and add your email.',
  'Choose an avatar, or just skip it — one is picked for you.',
  'Set a password and confirm it, then submit.',
  'Check your email for a verification link and tap it.',
  'Come back here and log in — you\'re in!',
]

function HowToCreateAccountDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <CircleHelp className="size-3.5" /> How do I create an account?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creating your account</DialogTitle>
          <DialogDescription>Takes about a minute.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-2.5 text-sm">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  )
}

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

          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PhoneCall className="size-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium">New here and not sure how to get set up?</p>
                <p className="text-muted-foreground">We're happy to walk you through it.</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold hover:border-primary/40"
              >
                <PhoneCall className="size-3.5" /> Call/Text
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 py-2 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/20"
              >
                <MessageCircle className="size-3.5" /> WhatsApp
              </a>
            </div>

            <HowToCreateAccountDialog />
          </div>
        </div>
      </div>
    </div>
  )
}
