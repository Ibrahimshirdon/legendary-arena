import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

// Always-available way to install, separate from the dismissible reminder
// banner — mobile-only since desktop already has the browser's own
// install affordance (address bar icon) plus the Settings page card.
export function InstallTopbarButton() {
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  if (installed || (!canInstall && !isIos)) return null

  async function handleClick() {
    if (isIos) {
      toast.info('Tap the Share button in Safari, then "Add to Home Screen".')
      return
    }
    await promptInstall()
  }

  return (
    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => void handleClick()} title="Install app" aria-label="Install app">
      <Download className="size-5" />
    </Button>
  )
}
