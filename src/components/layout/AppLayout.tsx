import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileNav } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { usePlayersStore } from '@/store/playersStore'
import { startAppStores } from '@/store/appStores'

export function AppLayout() {
  useEffect(() => {
    usePlayersStore.getState().start()
    startAppStores()
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
