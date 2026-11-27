import { Bell, BellOff, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotificationsCard() {
  const { permission, enable } = usePushNotifications()

  if (permission === 'unsupported') return null

  async function handleEnable() {
    const granted = await enable()
    if (granted) toast.success("Notifications are on — you'll get alerts even when the app is closed.")
    else toast.error('Notifications were not enabled.')
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold">Push Notifications</h3>
      {permission === 'granted' ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BellRing className="size-4 text-primary" /> Enabled — you'll be notified of new messages and activity even
          when the app is closed.
        </p>
      ) : permission === 'denied' ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BellOff className="size-4" /> Blocked in your browser settings. Re-enable notifications for this site in
          your browser to turn this back on.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Get notified of new messages, challenges, and results even when Legendary Arena isn't open — like
            WhatsApp.
          </p>
          <Button size="sm" onClick={() => void handleEnable()}>
            <Bell className="size-4" /> Enable Notifications
          </Button>
        </>
      )}
    </section>
  )
}
