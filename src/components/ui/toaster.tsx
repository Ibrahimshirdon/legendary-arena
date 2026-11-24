import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--card)',
          color: 'var(--card-foreground)',
          border: '1px solid var(--border)',
          borderRadius: '0.875rem',
        },
      }}
    />
  )
}
