import type { IArticleRepository, ArticleWithRelations } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'
import { NotFoundError } from '../../../shared/errors.js'

export interface GetArticleParams {
  id: string
  userId: string
}

export interface ArticleWithBookmark extends ArticleWithRelations {
  isBookmarked: boolean
}

export class GetArticleUseCase {
  constructor(
    private readonly articleRepo: IArticleRepository,
    private readonly bookmarkRepo: IBookmarkRepository,
  ) {}

  async execute(params: GetArticleParams): Promise<ArticleWithBookmark> {
    const { id, userId } = params

    const article = await this.articleRepo.findById(id)
    if (!article) {
      throw new NotFoundError(`Article with id "${id}" not found`)
    }

    const bookmark = await this.bookmarkRepo.findByUserAndArticle(userId, id)

    return {
      ...article,
      isBookmarked: bookmark !== null,
    }
  }
}
