import type { IArticleRepository } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'
import { NotFoundError } from '../../../shared/errors.js'

export interface ToggleBookmarkParams {
  userId: string
  articleId: string
  action: 'add' | 'remove'
}

export class ToggleBookmarkUseCase {
  constructor(
    private readonly bookmarkRepo: IBookmarkRepository,
    private readonly articleRepo: IArticleRepository,
  ) {}

  async execute(params: ToggleBookmarkParams): Promise<void> {
    const { userId, articleId, action } = params

    if (action === 'add') {
      const article = await this.articleRepo.findById(articleId)
      if (!article) {
        throw new NotFoundError(`Article with id "${articleId}" not found`)
      }
      // upsert — idempotent, no error if already exists
      await this.bookmarkRepo.create(userId, articleId)
    } else {
      // deleteMany — idempotent, no error if not found
      await this.bookmarkRepo.delete(userId, articleId)
    }
  }
}
