import type { IArticleRepository, ArticleWithRelations } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'

export interface ListArticlesParams {
  categoryId?: string
  page: number
  limit: number
  userId: string
}

export interface ArticleWithBookmark extends ArticleWithRelations {
  isBookmarked: boolean
}

export interface ListArticlesResult {
  items: ArticleWithBookmark[]
  total: number
  page: number
  limit: number
}

export class ListArticlesUseCase {
  constructor(
    private readonly articleRepo: IArticleRepository,
    private readonly bookmarkRepo: IBookmarkRepository,
  ) {}

  async execute(params: ListArticlesParams): Promise<ListArticlesResult> {
    const { categoryId, page, limit, userId } = params

    const [{ items, total }, bookmarks] = await Promise.all([
      this.articleRepo.findMany({ categoryId, page, limit }),
      this.bookmarkRepo.findByUserId(userId),
    ])

    const bookmarkedIds = new Set(bookmarks.map((b) => b.articleId))

    return {
      items: items.map((item) => ({
        ...item,
        isBookmarked: bookmarkedIds.has(item.id),
      })),
      total,
      page,
      limit,
    }
  }
}
