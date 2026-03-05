import { z } from 'zod'

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameEn: z.string(),
  nameRu: z.string(),
})

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  publishedAt: z.string(),
  source: z.object({ id: z.string(), name: z.string() }),
  category: categorySchema.nullable(),
  isBookmarked: z.boolean(),
})

export const articleListQuerySchema = z.object({
  categoryId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const articleListResponseSchema = z.object({
  items: z.array(articleSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export type Category = z.infer<typeof categorySchema>
export type Article = z.infer<typeof articleSchema>
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>
export type ArticleListResponse = z.infer<typeof articleListResponseSchema>
