import { Download, Share, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

const DISMISS_KEY = 'install-prompt-dismissed'
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

// Dismissing is permanent, not a snooze — re-nagging every few days was
// annoying. Anyone who changes their mind later still has the Install
// button that's always visible in the Topbar on mobile.
function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function InstallPromptBanner() {
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(readDismissed)

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* best-effort only — worst case it just asks again next visit */
    }
  }

  async function handleInstall() {
    const accepted = await promptInstall()
    if (accepted) setDismissed(true)
  }

  if (installed || dismissed) return null
  // iOS Safari never fires beforeinstallprompt, so there's nothing to trigger —
  // show manual instructions there instead of just not appearing at all.
  if (!canInstall && !isIos) return null

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl lg:inset-x-auto lg:bottom-4 lg:left-4 lg:w-80">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Install Legendary Arena</p>
        {isIos ? (
          <p className="text-xs text-muted-foreground">
            Tap <Share className="inline size-3 align-text-bottom" /> Share, then "Add to Home Screen".
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Add it to your home screen for one-tap access.</p>
        )}
      </div>
      {!isIos && (
        <Button size="sm" onClick={() => void handleInstall()}>
          <Download className="size-4" /> Install
        </Button>
      )}
      <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </div>
  )
}
