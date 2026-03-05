import { useEffect } from 'react'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  return <>{children}</>
}
