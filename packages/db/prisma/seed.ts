import { createPrismaClient } from '../src/index'

const prisma = createPrismaClient()

const categories = [
  {
    slug: 'technology',
    nameEn: 'Technology',
    nameRu: 'Технологии',
    keywords: [
      'tech', 'software', 'ai', 'programming', 'code', 'developer',
      'startup', 'app', 'digital', 'cyber', 'robot', 'machine learning',
      'javascript', 'python',
    ],
  },
  {
    slug: 'science',
    nameEn: 'Science',
    nameRu: 'Наука',
    keywords: [
      'science', 'research', 'study', 'discovery', 'biology', 'physics',
      'chemistry', 'climate', 'space', 'nasa', 'experiment',
    ],
  },
  {
    slug: 'business',
    nameEn: 'Business',
    nameRu: 'Бизнес',
    keywords: [
      'business', 'economy', 'market', 'stock', 'finance', 'trade',
      'investment', 'startup', 'company', 'revenue', 'profit', 'gdp',
    ],
  },
  {
    slug: 'politics',
    nameEn: 'Politics',
    nameRu: 'Политика',
    keywords: [
      'politics', 'government', 'election', 'president', 'congress',
      'senate', 'law', 'policy', 'democrat', 'republican', 'vote',
    ],
  },
  {
    slug: 'health',
    nameEn: 'Health',
    nameRu: 'Здоровье',
    keywords: [
      'health', 'medical', 'disease', 'vaccine', 'hospital', 'doctor',
      'medicine', 'virus', 'cancer', 'mental health', 'wellness',
    ],
  },
  {
    slug: 'world',
    nameEn: 'World',
    nameRu: 'Мир',
    keywords: [
      'world', 'international', 'global', 'country', 'war', 'conflict',
      'united nations', 'europe', 'asia', 'africa', 'diplomacy',
    ],
  },
]

const sources = [
  { name: 'BBC News', feedUrl: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'Reuters', feedUrl: 'https://feeds.reuters.com/reuters/topNews' },
  { name: 'Hacker News', feedUrl: 'https://hnrss.org/frontpage' },
  { name: 'TechCrunch', feedUrl: 'https://techcrunch.com/feed/' },
]

async function main() {
  console.log('Seeding categories...')
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('Seeding sources...')
  for (const src of sources) {
    await prisma.source.upsert({
      where: { feedUrl: src.feedUrl },
      update: {},
      create: src,
    })
  }

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
