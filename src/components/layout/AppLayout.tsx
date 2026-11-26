import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileNav } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { usePlayersStore } from '@/store/playersStore'
import { startAppStores, stopAppStores } from '@/store/appStores'

export function AppLayout() {
  useEffect(() => {
    usePlayersStore.getState().start()
    startAppStores()
    // Unmounts whenever we leave the authenticated area (logout, or Firebase
    // itself ending the session) — stop polling and drop cached data so it's
    // not visible to whoever signs in next on this device.
    return () => {
      usePlayersStore.getState().stop()
      stopAppStores()
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-background pitch-pattern">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden pb-20 lg:pb-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
