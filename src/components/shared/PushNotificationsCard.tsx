import { Bell, BellOff, BellRing } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotificationsCard() {
  const { permission, enabled, enable, disable } = usePushNotifications()
  const [busy, setBusy] = useState(false)

  if (permission === 'unsupported') return null

  async function handleEnable() {
    setBusy(true)
    try {
      const granted = await enable()
      if (granted) toast.success("Notifications are on — you'll get alerts even when the app is closed.")
      else toast.error("Notifications weren't enabled. Check your browser's site settings for this page.")
    } catch (err) {
      console.error('Push notification setup failed:', err)
      toast.error(err instanceof Error ? err.message : 'Could not enable notifications.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setBusy(true)
    try {
      await disable()
      toast.success('Notifications turned off.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not turn off notifications.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold">Push Notifications</h3>
      {permission === 'denied' ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BellOff className="size-4" /> Blocked in your browser settings. Re-enable notifications for this site in
          your browser to turn this back on.
        </p>
      ) : enabled ? (
        <>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellRing className="size-4 text-primary" /> On — you'll be notified of new messages and activity even
            when the app is closed.
          </p>
          <Button size="sm" variant="outline" onClick={() => void handleDisable()} disabled={busy}>
            <BellOff className="size-4" /> Turn Off
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Get notified of new messages, challenges, and results even when Legendary Arena isn't open — like
            WhatsApp.
          </p>
          <Button size="sm" onClick={() => void handleEnable()} disabled={busy}>
            <Bell className="size-4" /> {permission === 'granted' ? 'Turn On' : 'Enable Notifications'}
          </Button>
        </>
      )}
    </section>
  )
}
