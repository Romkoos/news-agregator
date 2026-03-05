import Parser from 'rss-parser'

export interface ParsedArticle {
  guid: string
  title: string
  summary: string | null
  url: string
  imageUrl: string | null
  publishedAt: Date
}

const parser = new Parser()

/**
 * Fetches and parses an RSS feed URL.
 * Returns an empty array on network or parse errors (soft failure —
 * the worker continues with remaining feeds).
 */
export async function fetchFeed(feedUrl: string): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl)

    return feed.items
      .filter((item) => item.link && item.title)
      .map((item) => ({
        guid: item.guid ?? item.link!,
        title: item.title!,
        summary: item.contentSnippet ?? item.summary ?? null,
        url: item.link!,
        imageUrl: item.enclosure?.url ?? null,
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      }))
  } catch (error) {
    console.error(`[worker] Failed to fetch feed ${feedUrl}:`, error)
    return []
  }
}
