import { createPrismaClient } from '@repo/db'
import { fetchFeed } from './fetcher.js'
import { categorize } from './categorizer.js'

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('[worker] DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const prisma = createPrismaClient(databaseUrl)

  try {
    console.log('[worker] Starting news fetch...')

    const [sources, categories] = await Promise.all([
      prisma.source.findMany(),
      prisma.category.findMany({ select: { id: true, keywords: true } }),
    ])

    console.log(`[worker] ${sources.length} source(s), ${categories.length} categorie(s) loaded`)

    let upserted = 0
    let skipped = 0

    for (const source of sources) {
      const articles = await fetchFeed(source.feedUrl)
      console.log(`[worker] "${source.name}": ${articles.length} article(s) fetched`)

      for (const article of articles) {
        const categoryId = categorize(article.title, article.summary, categories)

        try {
          await prisma.article.upsert({
            where: { guid: article.guid },
            create: {
              guid: article.guid,
              title: article.title,
              summary: article.summary,
              url: article.url,
              imageUrl: article.imageUrl,
              publishedAt: article.publishedAt,
              sourceId: source.id,
              categoryId,
            },
            update: {
              title: article.title,
              summary: article.summary,
              categoryId,
            },
          })
          upserted++
        } catch (err) {
          console.warn(`[worker] Skipping article guid="${article.guid}":`, err)
          skipped++
        }
      }
    }

    console.log(`[worker] Done. Upserted: ${upserted}, Skipped: ${skipped}`)
  } finally {
    await prisma.$disconnect()
  }
}

run().catch((err) => {
  console.error('[worker] Fatal error:', err)
  process.exit(1)
})
