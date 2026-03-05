import type { ICategoryRepository, CategoryEntity } from '../ports/category.repository.port.js'

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(): Promise<CategoryEntity[]> {
    return this.categoryRepo.findAll()
  }
}
