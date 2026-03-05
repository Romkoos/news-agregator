export interface CategoryRule {
  id: string
  keywords: string[]
}

/**
 * Returns the id of the first category whose keywords appear in the
 * concatenation of title + summary (case-insensitive).
 * Returns null if no category matches.
 */
export function categorize(
  title: string,
  summary: string | null,
  categories: CategoryRule[],
): string | null {
  const text = `${title} ${summary ?? ''}`.toLowerCase()

  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category.id
      }
    }
  }

  return null
}
