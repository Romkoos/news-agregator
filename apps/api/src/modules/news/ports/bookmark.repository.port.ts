export interface IBookmarkRepository {
  findByUserAndArticle(userId: string, articleId: string): Promise<{ id: string } | null>
  create(userId: string, articleId: string): Promise<void>
  delete(userId: string, articleId: string): Promise<void>
  findByUserId(userId: string): Promise<Array<{ articleId: string }>>
}
