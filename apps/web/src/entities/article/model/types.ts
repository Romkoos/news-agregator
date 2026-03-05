export interface ArticleSource {
  id: string
  name: string
}

export interface ArticleCategory {
  id: string
  slug: string
  nameEn: string
  nameRu: string
}

export interface Article {
  id: string
  title: string
  summary: string | null
  url: string
  imageUrl: string | null
  publishedAt: string
  source: ArticleSource
  category: ArticleCategory | null
  isBookmarked: boolean
}

export interface ArticleListResponse {
  items: Article[]
  total: number
  page: number
  limit: number
}
