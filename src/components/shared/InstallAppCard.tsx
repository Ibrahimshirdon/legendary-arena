import { Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

export function InstallAppCard() {
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  if (installed) return null
  // Nothing to offer: not iOS, and the browser hasn't signaled it's installable yet.
  if (!canInstall && !isIos) return null

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold">Install the App</h3>
      {isIos ? (
        <p className="text-sm text-muted-foreground">
          Tap the <Share className="inline size-3.5 align-text-bottom" /> Share button in Safari, then choose "Add to Home
          Screen" to install Legendary Arena on your iPhone/iPad.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Add Legendary Arena to your phone or desktop for one-tap access, just like a native app.
          </p>
          <Button size="sm" onClick={() => void promptInstall()}>
            <Download className="size-4" /> Install App
          </Button>
        </>
      )}
    </section>
  )
}
