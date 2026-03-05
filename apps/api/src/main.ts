import { buildServer } from './infrastructure/server.js'
import { createPrismaClient } from '@repo/db'

// Auth adapters
import { PrismaUserRepository } from './modules/auth/adapters/prisma/prisma-user.repository.js'
import { PrismaRefreshTokenRepository } from './modules/auth/adapters/prisma/prisma-refresh-token.repository.js'
import { JwtTokenService } from './modules/auth/adapters/jwt/jwt-token.service.js'

// Auth use-cases
import { RegisterUseCase } from './modules/auth/application/register.use-case.js'
import { LoginUseCase } from './modules/auth/application/login.use-case.js'
import { RefreshTokenUseCase } from './modules/auth/application/refresh-token.use-case.js'
import { LogoutUseCase } from './modules/auth/application/logout.use-case.js'

// Auth routes
import { registerAuthRoutes } from './modules/auth/adapters/http/auth.routes.js'

// User adapters
import { PrismaUserPreferencesRepository } from './modules/user/adapters/prisma/prisma-user-preferences.repository.js'

// User use-cases
import { GetProfileUseCase } from './modules/user/application/get-profile.use-case.js'
import { UpdateProfileUseCase } from './modules/user/application/update-profile.use-case.js'
import { UpdatePreferencesUseCase } from './modules/user/application/update-preferences.use-case.js'
import { ChangePasswordUseCase } from './modules/user/application/change-password.use-case.js'

// User routes
import { registerUserRoutes } from './modules/user/adapters/http/user.routes.js'

// News adapters
import { PrismaArticleRepository } from './modules/news/adapters/prisma/prisma-article.repository.js'
import { PrismaBookmarkRepository } from './modules/news/adapters/prisma/prisma-bookmark.repository.js'
import { PrismaCategoryRepository } from './modules/news/adapters/prisma/prisma-category.repository.js'

// News use-cases
import { ListCategoriesUseCase } from './modules/news/application/list-categories.use-case.js'
import { ListArticlesUseCase } from './modules/news/application/list-articles.use-case.js'
import { GetArticleUseCase } from './modules/news/application/get-article.use-case.js'
import { ToggleBookmarkUseCase } from './modules/news/application/toggle-bookmark.use-case.js'
import { GetBookmarksUseCase } from './modules/news/application/get-bookmarks.use-case.js'

// News routes
import { registerNewsRoutes } from './modules/news/adapters/http/news.routes.js'

// Infrastructure
const prisma = createPrismaClient(process.env.DATABASE_URL)

// Auth layer
const userRepo = new PrismaUserRepository(prisma)
const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma)
const tokenService = new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret')

// User layer
const prefsRepo = new PrismaUserPreferencesRepository(prisma)

// News layer
const articleRepo = new PrismaArticleRepository(prisma)
const bookmarkRepo = new PrismaBookmarkRepository(prisma)
const categoryRepo = new PrismaCategoryRepository(prisma)

// Server
const server = buildServer({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

// Route registration
registerAuthRoutes(server, {
  register: new RegisterUseCase(userRepo, tokenService, refreshTokenRepo, prefsRepo),
  login: new LoginUseCase(userRepo, tokenService, refreshTokenRepo),
  refresh: new RefreshTokenUseCase(refreshTokenRepo, tokenService, userRepo),
  logout: new LogoutUseCase(refreshTokenRepo),
})

registerUserRoutes(server, {
  getProfile: new GetProfileUseCase(userRepo, prefsRepo),
  updateProfile: new UpdateProfileUseCase(userRepo),
  updatePreferences: new UpdatePreferencesUseCase(prefsRepo),
  changePassword: new ChangePasswordUseCase(userRepo),
})

registerNewsRoutes(server, {
  listCategories: new ListCategoriesUseCase(categoryRepo),
  listArticles: new ListArticlesUseCase(articleRepo, bookmarkRepo),
  getArticle: new GetArticleUseCase(articleRepo, bookmarkRepo),
  toggleBookmark: new ToggleBookmarkUseCase(bookmarkRepo, articleRepo),
  getBookmarks: new GetBookmarksUseCase(bookmarkRepo, articleRepo),
})

// Start
const port = Number(process.env.PORT ?? 3001)
server.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
})
