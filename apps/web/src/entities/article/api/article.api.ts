import { api } from '@/shared/api/index.js'
import type { Article, ArticleListResponse } from '../model/types.js'

export const articleApi = {
  list(params: { categoryId?: string; page?: number; limit?: number }) {
    return api
      .get<ArticleListResponse>('/news/articles', { params })
      .then((r) => r.data)
  },

  getById(id: string) {
    return api.get<Article>(`/news/articles/${id}`).then((r) => r.data)
  },

  bookmark(id: string) {
    return api.post(`/news/articles/${id}/bookmark`)
  },

  unbookmark(id: string) {
    return api.delete(`/news/articles/${id}/bookmark`)
  },

  listBookmarks() {
    return api.get<ArticleListResponse>('/news/bookmarks').then((r) => r.data)
  },
}
