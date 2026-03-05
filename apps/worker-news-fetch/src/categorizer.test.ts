import { describe, it, expect } from 'vitest'
import { categorize } from './categorizer.js'

const categories = [
  { id: 'tech-id', keywords: ['javascript', 'software', 'ai'] },
  { id: 'science-id', keywords: ['research', 'study', 'biology'] },
]

describe('categorize', () => {
  it('returns categoryId when keyword matches in title', () => {
    expect(categorize('New JavaScript framework released', null, categories)).toBe('tech-id')
  })

  it('matches keyword in summary when title has no match', () => {
    expect(
      categorize('Interesting findings', 'A new biology study reveals...', categories),
    ).toBe('science-id')
  })

  it('is case-insensitive for both keyword and text', () => {
    expect(categorize('AI Is Changing Everything', null, categories)).toBe('tech-id')
  })

  it('returns null when no keyword matches title or summary', () => {
    expect(categorize('Sports results', 'Football game results', categories)).toBeNull()
  })

  it('returns null when categories array is empty', () => {
    expect(categorize('JavaScript news', null, [])).toBeNull()
  })

  it('returns null when title and summary are both empty strings', () => {
    expect(categorize('', '', categories)).toBeNull()
  })

  it('returns the first matching category (order matters)', () => {
    expect(categorize('software research', null, categories)).toBe('tech-id')
  })

  it('matches across title and summary concatenated', () => {
    expect(categorize('javascript tips', 'research-backed approach', categories)).toBe('tech-id')
  })

  it('handles null summary gracefully', () => {
    expect(categorize('biology breakthroughs', null, categories)).toBe('science-id')
  })
})
