import type { IArticleRepository } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'
import type { ArticleWithBookmark } from './list-articles.use-case.js'

export interface GetBookmarksParams {
  userId: string
  page: number
  limit: number
}

export interface GetBookmarksResult {
  items: ArticleWithBookmark[]
  total: number
  page: number
  limit: number
}

export class GetBookmarksUseCase {
  constructor(
    private readonly bookmarkRepo: IBookmarkRepository,
    private readonly articleRepo: IArticleRepository,
  ) {}

  async execute(params: GetBookmarksParams): Promise<GetBookmarksResult> {
    const { userId, page, limit } = params

    const bookmarks = await this.bookmarkRepo.findByUserId(userId)
    const articleIds = bookmarks.map((b) => b.articleId)

    const articleResults = await Promise.all(articleIds.map((id) => this.articleRepo.findById(id)))
    const articles = articleResults.filter((a): a is NonNullable<typeof a> => a !== null)

    const total = articles.length
    const start = (page - 1) * limit
    const pageItems = articles.slice(start, start + limit)

    return {
      items: pageItems.map((article) => ({ ...article, isBookmarked: true })),
      total,
      page,
      limit,
    }
  }
}
