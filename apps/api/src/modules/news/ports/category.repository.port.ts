export interface CategoryEntity {
  id: string
  slug: string
  nameEn: string
  nameRu: string
}

export interface ICategoryRepository {
  findAll(): Promise<CategoryEntity[]>
}
