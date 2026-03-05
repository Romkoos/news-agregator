export interface ArticleWithRelations {
  id: string
  title: string
  summary: string | null
  url: string
  imageUrl: string | null
  publishedAt: Date
  source: { id: string; name: string }
  category: { id: string; slug: string; nameEn: string; nameRu: string } | null
}

export interface IArticleRepository {
  findMany(params: {
    categoryId?: string
    page: number
    limit: number
  }): Promise<{ items: ArticleWithRelations[]; total: number }>
  findById(id: string): Promise<ArticleWithRelations | null>
}
