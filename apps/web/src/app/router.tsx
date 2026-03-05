import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './guards/AuthGuard.js'
import { AppLayout } from './layouts/AppLayout.js'
import { LoginPage } from '@/pages/auth/index.js'
import { RegisterPage } from '@/pages/auth/index.js'
import { DashboardPage } from '@/pages/dashboard/index.js'
import { NewsPage } from '@/pages/news/index.js'
import { BookmarksPage } from '@/pages/bookmarks/index.js'
import { SettingsPage } from '@/pages/settings/index.js'
import { ProfilePage } from '@/pages/profile/index.js'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/news', element: <NewsPage /> },
          { path: '/bookmarks', element: <BookmarksPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
