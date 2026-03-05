import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Dashboard (placeholder)</div>,
  },
  {
    path: '/login',
    element: <div>Login (placeholder)</div>,
  },
] as const)
