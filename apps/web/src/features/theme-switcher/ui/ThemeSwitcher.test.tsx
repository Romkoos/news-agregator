import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeSwitcher } from './ThemeSwitcher.js'

function renderSwitcher() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ThemeSwitcher />
    </QueryClientProvider>
  )
}

function getHtmlClass() {
  return document.documentElement.classList
}

beforeEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('ThemeSwitcher', () => {
  it('renders light and dark options', () => {
    renderSwitcher()
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument()
  })

  it('adds dark class to html element when dark is selected', async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(screen.getByRole('button', { name: /dark/i }))
    expect(getHtmlClass().contains('dark')).toBe(true)
  })

  it('removes dark class when light is selected after dark', async () => {
    const user = userEvent.setup()
    document.documentElement.classList.add('dark')
    renderSwitcher()
    await user.click(screen.getByRole('button', { name: /light/i }))
    expect(getHtmlClass().contains('dark')).toBe(false)
  })
})
