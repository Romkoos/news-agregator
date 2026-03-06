import { Outlet } from 'react-router-dom'
import { Sidebar, BottomNav } from '@/widgets/sidebar/index.js'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <div className="mx-auto max-w-5xl p-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
