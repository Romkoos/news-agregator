import { describe, it, expect, beforeAll } from 'vitest'
import i18n from './i18n.js'

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

describe('i18n', () => {
  it('translates nav.dashboard in English', () => {
    expect(i18n.t('nav.dashboard')).toBe('Dashboard')
  })

  it('translates nav.dashboard in Russian after language change', async () => {
    await i18n.changeLanguage('ru')
    expect(i18n.t('nav.dashboard')).toBe('Главная')
    await i18n.changeLanguage('en')
  })

  it('falls back to English for unknown language', async () => {
    await i18n.changeLanguage('fr')
    expect(i18n.t('nav.dashboard')).toBe('Dashboard')
    await i18n.changeLanguage('en')
  })
})
