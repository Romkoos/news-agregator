import { api } from '@/shared/api/index.js'
import type { Category } from '../model/types.js'

export const categoryApi = {
  list() {
    return api.get<Category[]>('/news/categories').then((r) => r.data)
  },
}
