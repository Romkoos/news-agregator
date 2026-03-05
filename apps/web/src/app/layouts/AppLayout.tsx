import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/widgets/sidebar/index.js'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
