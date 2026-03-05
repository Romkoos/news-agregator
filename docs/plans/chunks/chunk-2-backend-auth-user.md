## Phase 2: Backend — Auth & User Modules (Tasks 6–10)

---

### Task 6: Auth domain, ports, and RegisterUseCase unit test

**Files:**
- Create: `apps/api/src/modules/auth/domain/user.entity.ts`
- Create: `apps/api/src/modules/auth/ports/user.repository.port.ts`
- Create: `apps/api/src/modules/auth/ports/token.service.port.ts`
- Create: `apps/api/src/modules/auth/ports/refresh-token.repository.port.ts`
- Create: `apps/api/src/modules/auth/ports/user-preferences.repository.port.ts` *(re-export from user module — see note below)*
- Create: `apps/api/src/modules/auth/application/register.use-case.ts`
- Create: `apps/api/src/modules/auth/application/register.use-case.test.ts`

> **Note:** `IUserPreferencesRepository` is defined in the user module at `apps/api/src/modules/user/ports/user-preferences.repository.port.ts` (Task 10). `RegisterUseCase` imports it from there. The interface only needs the `create` method. The Prisma adapter is shared between modules.

**Step 1: Write failing test**

First, create all domain and port files so TypeScript can resolve imports in the test.

`apps/api/src/modules/auth/domain/user.entity.ts`:
```ts
export interface UserEntity {
  id: string
  email: string
  passwordHash: string
  name: string
  avatarUrl: string | null
}
```

`apps/api/src/modules/auth/ports/user.repository.port.ts`:
```ts
import type { UserEntity } from '../domain/user.entity.js'

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>
  findById(id: string): Promise<UserEntity | null>
  create(data: Omit<UserEntity, 'id'>): Promise<UserEntity>
  update(id: string, data: Partial<Omit<UserEntity, 'id'>>): Promise<UserEntity>
}
```

`apps/api/src/modules/auth/ports/token.service.port.ts`:
```ts
export interface ITokenService {
  signAccessToken(payload: { userId: string; email: string }): string
  verifyAccessToken(token: string): { userId: string; email: string }
}
```

`apps/api/src/modules/auth/ports/refresh-token.repository.port.ts`:
```ts
export interface IRefreshTokenRepository {
  create(data: { token: string; userId: string; expiresAt: Date }): Promise<void>
  findByToken(token: string): Promise<{ userId: string; expiresAt: Date } | null>
  deleteByToken(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
}
```

Create a stub `apps/api/src/modules/auth/application/register.use-case.ts` that exports the class but does not implement logic (so the test file can be imported and the tests can fail on assertions, not on missing exports):

```ts
// apps/api/src/modules/auth/application/register.use-case.ts — STUB (will be replaced in Step 3)
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

export interface RegisterDto {
  email: string
  password: string
  name: string
}

export interface RegisterResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string; avatarUrl: string | null }
}

export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(_dto: RegisterDto): Promise<RegisterResult> {
    throw new Error('Not implemented')
  }
}
```

Now write the test file:

`apps/api/src/modules/auth/application/register.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegisterUseCase } from './register.use-case.js'
import { EmailAlreadyExistsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { IUserPreferencesRepository } from '../../user/ports/user-preferences.repository.port.js'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const mockTokenService: ITokenService = {
  signAccessToken: vi.fn().mockReturnValue('access-token-xyz'),
  verifyAccessToken: vi.fn(),
}

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

const mockPrefsRepo: IUserPreferencesRepository = {
  findByUserId: vi.fn(),
  upsert: vi.fn().mockResolvedValue({ theme: 'LIGHT', language: 'en' }),
}

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new RegisterUseCase(mockUserRepo, mockTokenService, mockRefreshTokenRepo, mockPrefsRepo)
  })

  it('creates user and returns tokens when email is unique', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUserRepo.create).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test User',
      avatarUrl: null,
    })

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })

    expect(result.accessToken).toBe('access-token-xyz')
    expect(result.user.email).toBe('test@example.com')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledOnce()
    // Default preferences must be created on every registration
    expect(mockPrefsRepo.upsert).toHaveBeenCalledWith('user-1', { theme: 'LIGHT', language: 'en' })
  })

  it('throws EmailAlreadyExistsError when email is taken', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test User',
      avatarUrl: null,
    })

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
    ).rejects.toThrow(EmailAlreadyExistsError)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter api vitest run src/modules/auth/application/register.use-case.test.ts
```

Expected: FAIL — both tests fail because `execute` throws `Error('Not implemented')` instead of performing real logic.

**Step 3: Implement**

Replace the stub with the full implementation in `apps/api/src/modules/auth/application/register.use-case.ts`:

`RegisterUseCase` creates `UserPreferences` with default values (`LIGHT` theme, `'en'` language) immediately after user creation, as required by the design: *"UserPreferences created eagerly on register with defaults."*

```ts
import bcrypt from 'bcryptjs'
import { EmailAlreadyExistsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { IUserPreferencesRepository } from '../../user/ports/user-preferences.repository.port.js'

export interface RegisterDto {
  email: string
  password: string
  name: string
}

export interface RegisterResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string; avatarUrl: string | null }
}

export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly prefsRepo: IUserPreferencesRepository,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.userRepo.findByEmail(dto.email)
    if (existing) {
      throw new EmailAlreadyExistsError(`Email ${dto.email} is already registered`)
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      avatarUrl: null,
    })

    // Create default preferences eagerly — every user always has preferences.
    await this.prefsRepo.upsert(user.id, { theme: 'LIGHT', language: 'en' })

    const accessToken = this.tokenService.signAccessToken({ userId: user.id, email: user.email })

    const refreshToken = crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.refreshTokenRepo.create({ token: refreshToken, userId: user.id, expiresAt })

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter api vitest run src/modules/auth/application/register.use-case.test.ts
```

Expected: PASS — both test cases pass.

**Step 5: Commit**

```bash
git add apps/api/src/modules/auth/domain/user.entity.ts \
        apps/api/src/modules/auth/ports/user.repository.port.ts \
        apps/api/src/modules/auth/ports/token.service.port.ts \
        apps/api/src/modules/auth/ports/refresh-token.repository.port.ts \
        apps/api/src/modules/auth/application/register.use-case.ts \
        apps/api/src/modules/auth/application/register.use-case.test.ts
git commit -m "feat(auth): add RegisterUseCase with unit tests"
```

---

### Task 7: LoginUseCase + RefreshTokenUseCase + LogoutUseCase

**Files:**
- Create: `apps/api/src/modules/auth/application/login.use-case.ts`
- Create: `apps/api/src/modules/auth/application/login.use-case.test.ts`
- Create: `apps/api/src/modules/auth/application/refresh-token.use-case.ts`
- Create: `apps/api/src/modules/auth/application/refresh-token.use-case.test.ts`
- Create: `apps/api/src/modules/auth/application/logout.use-case.ts`
- Create: `apps/api/src/modules/auth/application/logout.use-case.test.ts`

**Step 1: Write failing tests**

Create stub implementations first so tests compile but fail.

`apps/api/src/modules/auth/application/login.use-case.ts` (stub):
```ts
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

export interface LoginDto {
  email: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string; avatarUrl: string | null }
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(_dto: LoginDto): Promise<LoginResult> {
    throw new Error('Not implemented')
  }
}
```

`apps/api/src/modules/auth/application/refresh-token.use-case.ts` (stub):
```ts
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(_token: string): Promise<RefreshTokenResult> {
    throw new Error('Not implemented')
  }
}
```

`apps/api/src/modules/auth/application/logout.use-case.ts` (stub):
```ts
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: IRefreshTokenRepository) {}

  async execute(_token: string): Promise<void> {
    throw new Error('Not implemented')
  }
}
```

Now write all three test files:

`apps/api/src/modules/auth/application/login.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginUseCase } from './login.use-case.js'
import { InvalidCredentialsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

const HASHED_PASSWORD = '$2a$10$examplehashedpassword1234567890abcdef'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const mockTokenService: ITokenService = {
  signAccessToken: vi.fn().mockReturnValue('access-token-abc'),
  verifyAccessToken: vi.fn(),
}

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

const existingUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: HASHED_PASSWORD,
  name: 'Test User',
  avatarUrl: null,
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new LoginUseCase(mockUserRepo, mockTokenService, mockRefreshTokenRepo)
  })

  it('returns tokens when credentials are valid', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(existingUser)
    // bcrypt.compare will be called with the real password — we mock the user's hash to match
    // Use a real bcrypt hash to avoid mocking bcrypt itself; generate it in a helper or use vi.mock
    // Here we use vi.mock for bcryptjs to keep the test fast and deterministic
    const bcrypt = await import('bcryptjs')
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' })

    expect(result.accessToken).toBe('access-token-abc')
    expect(result.user.email).toBe('test@example.com')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledOnce()
  })

  it('throws InvalidCredentialsError when user is not found', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null)

    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('throws InvalidCredentialsError when password does not match', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(existingUser)
    const bcrypt = await import('bcryptjs')
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'wrongpassword' }),
    ).rejects.toThrow(InvalidCredentialsError)
  })
})
```

`apps/api/src/modules/auth/application/refresh-token.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RefreshTokenUseCase } from './refresh-token.use-case.js'
import { InvalidTokenError } from '../../../shared/errors.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

const mockTokenService: ITokenService = {
  signAccessToken: vi.fn().mockReturnValue('new-access-token'),
  verifyAccessToken: vi.fn(),
}

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new RefreshTokenUseCase(mockRefreshTokenRepo, mockTokenService)
  })

  it('returns new tokens when refresh token is valid and not expired', async () => {
    vi.mocked(mockRefreshTokenRepo.findByToken).mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
    })

    const result = await useCase.execute('valid-refresh-token')

    expect(result.accessToken).toBe('new-access-token')
    expect(result.refreshToken).toBeDefined()
    expect(typeof result.refreshToken).toBe('string')
    expect(mockRefreshTokenRepo.deleteByToken).toHaveBeenCalledWith('valid-refresh-token')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledOnce()
  })

  it('throws InvalidTokenError when refresh token is not found', async () => {
    vi.mocked(mockRefreshTokenRepo.findByToken).mockResolvedValue(null)

    await expect(useCase.execute('unknown-token')).rejects.toThrow(InvalidTokenError)
  })

  it('throws InvalidTokenError when refresh token is expired', async () => {
    vi.mocked(mockRefreshTokenRepo.findByToken).mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
    })

    await expect(useCase.execute('expired-token')).rejects.toThrow(InvalidTokenError)
  })
})
```

`apps/api/src/modules/auth/application/logout.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LogoutUseCase } from './logout.use-case.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new LogoutUseCase(mockRefreshTokenRepo)
  })

  it('deletes the refresh token from the repository', async () => {
    vi.mocked(mockRefreshTokenRepo.deleteByToken).mockResolvedValue(undefined)

    await useCase.execute('some-refresh-token')

    expect(mockRefreshTokenRepo.deleteByToken).toHaveBeenCalledWith('some-refresh-token')
  })

  it('does not throw when token is not found (fire and forget)', async () => {
    vi.mocked(mockRefreshTokenRepo.deleteByToken).mockResolvedValue(undefined)

    await expect(useCase.execute('nonexistent-token')).resolves.toBeUndefined()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter api vitest run src/modules/auth/application/login.use-case.test.ts \
  src/modules/auth/application/refresh-token.use-case.test.ts \
  src/modules/auth/application/logout.use-case.test.ts
```

Expected: FAIL — all `execute` methods throw `Error('Not implemented')`.

**Step 3: Implement**

`apps/api/src/modules/auth/application/login.use-case.ts`:
```ts
import bcrypt from 'bcryptjs'
import { InvalidCredentialsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

export interface LoginDto {
  email: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string; avatarUrl: string | null }
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(dto.email)
    if (!user) {
      throw new InvalidCredentialsError('Invalid email or password')
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError('Invalid email or password')
    }

    const accessToken = this.tokenService.signAccessToken({ userId: user.id, email: user.email })

    const refreshToken = crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.refreshTokenRepo.create({ token: refreshToken, userId: user.id, expiresAt })

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    }
  }
}
```

`apps/api/src/modules/auth/application/refresh-token.use-case.ts`:
```ts
import { InvalidTokenError } from '../../../shared/errors.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(token: string): Promise<RefreshTokenResult> {
    const stored = await this.refreshTokenRepo.findByToken(token)
    if (!stored) {
      throw new InvalidTokenError('Refresh token not found')
    }
    if (stored.expiresAt < new Date()) {
      throw new InvalidTokenError('Refresh token has expired')
    }

    // Rotate: invalidate the old token
    await this.refreshTokenRepo.deleteByToken(token)

    const accessToken = this.tokenService.signAccessToken({ userId: stored.userId, email: '' })

    const newRefreshToken = crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.refreshTokenRepo.create({ token: newRefreshToken, userId: stored.userId, expiresAt })

    return { accessToken, refreshToken: newRefreshToken }
  }
}
```

Note: `RefreshTokenUseCase` does not have access to the user's email from the stored refresh token record. If the access token payload must include email, either store email alongside the refresh token in the DB or fetch the user by ID inside the use-case. The implementation below fetches by ID and requires the `IUserRepository` port to be injected:

```ts
// apps/api/src/modules/auth/application/refresh-token.use-case.ts (with user lookup)
import { InvalidTokenError, NotFoundError } from '../../../shared/errors.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IUserRepository } from '../ports/user.repository.port.js'

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(token: string): Promise<RefreshTokenResult> {
    const stored = await this.refreshTokenRepo.findByToken(token)
    if (!stored) {
      throw new InvalidTokenError('Refresh token not found')
    }
    if (stored.expiresAt < new Date()) {
      await this.refreshTokenRepo.deleteByToken(token)
      throw new InvalidTokenError('Refresh token has expired')
    }

    const user = await this.userRepo.findById(stored.userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Rotate: invalidate old token before issuing new one
    await this.refreshTokenRepo.deleteByToken(token)

    const accessToken = this.tokenService.signAccessToken({ userId: user.id, email: user.email })

    const newRefreshToken = crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.refreshTokenRepo.create({ token: newRefreshToken, userId: user.id, expiresAt })

    return { accessToken, refreshToken: newRefreshToken }
  }
}
```

Update the test mock accordingly to include the `userRepo` argument in the constructor and add a `mockUserRepo` mock:

```ts
// Update refresh-token.use-case.test.ts constructor calls:
// useCase = new RefreshTokenUseCase(mockRefreshTokenRepo, mockTokenService, mockUserRepo)
// Add mockUserRepo with findById returning a user when needed
```

`apps/api/src/modules/auth/application/logout.use-case.ts`:
```ts
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: IRefreshTokenRepository) {}

  async execute(token: string): Promise<void> {
    // Fire and forget — do not throw if the token does not exist
    await this.refreshTokenRepo.deleteByToken(token)
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter api vitest run src/modules/auth/application/login.use-case.test.ts \
  src/modules/auth/application/refresh-token.use-case.test.ts \
  src/modules/auth/application/logout.use-case.test.ts
```

Expected: PASS — all test cases pass.

**Step 5: Commit**

```bash
git add apps/api/src/modules/auth/application/login.use-case.ts \
        apps/api/src/modules/auth/application/login.use-case.test.ts \
        apps/api/src/modules/auth/application/refresh-token.use-case.ts \
        apps/api/src/modules/auth/application/refresh-token.use-case.test.ts \
        apps/api/src/modules/auth/application/logout.use-case.ts \
        apps/api/src/modules/auth/application/logout.use-case.test.ts
git commit -m "feat(auth): add login, refresh-token, logout use-cases"
```

---

### Task 8: Auth adapters (PrismaUserRepository, JwtTokenService, PrismaRefreshTokenRepository)

**Files:**
- Create: `apps/api/src/modules/auth/adapters/prisma/prisma-user.repository.ts`
- Create: `apps/api/src/modules/auth/adapters/prisma/prisma-refresh-token.repository.ts`
- Create: `apps/api/src/modules/auth/adapters/jwt/jwt-token.service.ts`

These adapters wire the domain ports to real infrastructure. They are not tested in isolation with unit tests; they are validated by the integration tests in Task 9.

Before implementing, add the required dependency:

```bash
pnpm --filter api add jsonwebtoken
pnpm --filter api add -D @types/jsonwebtoken
```

**Step 1: Write the adapter files**

`apps/api/src/modules/auth/adapters/prisma/prisma-user.repository.ts`:
```ts
import type { PrismaClient } from '@repo/db'
import type { IUserRepository } from '../../ports/user.repository.port.js'
import type { UserEntity } from '../../domain/user.entity.js'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async create(data: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    return this.prisma.user.create({ data })
  }

  async update(id: string, data: Partial<Omit<UserEntity, 'id'>>): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data })
  }
}
```

`apps/api/src/modules/auth/adapters/prisma/prisma-refresh-token.repository.ts`:
```ts
import type { PrismaClient } from '@repo/db'
import type { IRefreshTokenRepository } from '../../ports/refresh-token.repository.port.js'

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { token: string; userId: string; expiresAt: Date }): Promise<void> {
    await this.prisma.refreshToken.create({ data })
  }

  async findByToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    const rt = await this.prisma.refreshToken.findUnique({ where: { token } })
    if (!rt) return null
    return { userId: rt.userId, expiresAt: rt.expiresAt }
  }

  async deleteByToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } })
  }
}
```

`apps/api/src/modules/auth/adapters/jwt/jwt-token.service.ts`:
```ts
import jwt from 'jsonwebtoken'
import type { ITokenService } from '../../ports/token.service.port.js'
import { InvalidTokenError } from '../../../../shared/errors.js'

export class JwtTokenService implements ITokenService {
  constructor(private readonly secret: string) {}

  signAccessToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: '15m' })
  }

  verifyAccessToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, this.secret) as { userId: string; email: string }
    } catch {
      throw new InvalidTokenError('Invalid or expired token')
    }
  }
}
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm --filter api tsc --noEmit
```

Expected: No type errors. If errors appear fix import paths or missing type declarations before proceeding.

**Step 3: Commit**

```bash
git add apps/api/src/modules/auth/adapters/prisma/prisma-user.repository.ts \
        apps/api/src/modules/auth/adapters/prisma/prisma-refresh-token.repository.ts \
        apps/api/src/modules/auth/adapters/jwt/jwt-token.service.ts \
        apps/api/package.json \
        pnpm-lock.yaml
git commit -m "feat(auth): add Prisma and JWT adapters"
```

---

### Task 9: Auth HTTP routes + integration tests

**Files:**
- Create: `apps/api/src/modules/auth/adapters/http/auth.routes.ts`
- Create: `apps/api/src/modules/auth/tests/auth.integration.test.ts`

**Step 1: Write failing integration test**

The integration test is written first. At this point `auth.routes.ts` does not exist yet, so the test will fail to compile or will fail at runtime because the route file is missing.

`apps/api/src/modules/auth/tests/auth.integration.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'
import { createPrismaClient } from '@repo/db'
import { buildServer } from '../../../infrastructure/server.js'
import { PrismaUserRepository } from '../adapters/prisma/prisma-user.repository.js'
import { PrismaRefreshTokenRepository } from '../adapters/prisma/prisma-refresh-token.repository.js'
import { PrismaUserPreferencesRepository } from '../../user/adapters/prisma/prisma-user-preferences.repository.js'
import { JwtTokenService } from '../adapters/jwt/jwt-token.service.js'
import { RegisterUseCase } from '../application/register.use-case.js'
import { LoginUseCase } from '../application/login.use-case.js'
import { RefreshTokenUseCase } from '../application/refresh-token.use-case.js'
import { LogoutUseCase } from '../application/logout.use-case.js'
import { registerAuthRoutes } from '../adapters/http/auth.routes.js'
import type { FastifyInstance } from 'fastify'

let container: Awaited<ReturnType<typeof new PostgreSqlContainer().start>>
let prisma: ReturnType<typeof createPrismaClient>
let server: FastifyInstance

const JWT_SECRET = 'integration-test-secret'

beforeAll(async () => {
  container = await new PostgreSqlContainer().start()
  const url = container.getConnectionUri()

  execSync(`pnpm --filter @repo/db prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })

  prisma = createPrismaClient(url)

  const userRepo = new PrismaUserRepository(prisma)
  const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma)
  const tokenService = new JwtTokenService(JWT_SECRET)

  server = buildServer({ jwtSecret: JWT_SECRET, corsOrigin: '*' })

  // prefsRepo needed by RegisterUseCase to create default preferences on register
  const prefsRepo = new PrismaUserPreferencesRepository(prisma)

  registerAuthRoutes(server, {
    register: new RegisterUseCase(userRepo, tokenService, refreshTokenRepo, prefsRepo),
    login: new LoginUseCase(userRepo, tokenService, refreshTokenRepo),
    refresh: new RefreshTokenUseCase(refreshTokenRepo, tokenService, userRepo),
    logout: new LogoutUseCase(refreshTokenRepo),
  })

  await server.ready()
}, 60_000)

afterAll(async () => {
  await server.close()
  await prisma.$disconnect()
  await container.stop()
})

beforeEach(async () => {
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

describe('POST /auth/register', () => {
  it('creates a user and returns 201 with accessToken and refreshToken cookie', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'Alice' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.accessToken).toBeDefined()
    expect(body.user.email).toBe('alice@example.com')
    expect(body.user.id).toBeDefined()
    expect(res.cookies.find((c) => c.name === 'refreshToken')).toBeDefined()
  })

  it('returns 409 when email is already registered', async () => {
    await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'Alice' },
    })

    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'Alice' },
    })

    expect(res.statusCode).toBe(409)
  })

  it('returns 400 when request body is invalid', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'not-an-email', password: '123', name: '' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('POST /auth/login', () => {
  it('returns 200 with accessToken and refreshToken cookie on valid credentials', async () => {
    await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'bob@example.com', password: 'password123', name: 'Bob' },
    })

    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'bob@example.com', password: 'password123' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.accessToken).toBeDefined()
    expect(body.user.email).toBe('bob@example.com')
    expect(res.cookies.find((c) => c.name === 'refreshToken')).toBeDefined()
  })

  it('returns 401 on wrong password', async () => {
    await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'bob@example.com', password: 'password123', name: 'Bob' },
    })

    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'bob@example.com', password: 'wrongpassword' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when user does not exist', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('POST /auth/refresh', () => {
  it('returns 200 with new accessToken given a valid refreshToken cookie', async () => {
    const regRes = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'carol@example.com', password: 'password123', name: 'Carol' },
    })
    const refreshCookie = regRes.cookies.find((c) => c.name === 'refreshToken')!

    const res = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: refreshCookie.value },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().accessToken).toBeDefined()
    // A new refreshToken cookie must be set (rotation)
    expect(res.cookies.find((c) => c.name === 'refreshToken')).toBeDefined()
  })

  it('returns 401 when no refreshToken cookie is present', async () => {
    const res = await server.inject({ method: 'POST', url: '/auth/refresh' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when refreshToken is invalid', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: 'invalid-token-value' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('DELETE /auth/logout', () => {
  it('returns 204 and clears the refreshToken cookie', async () => {
    const regRes = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dave@example.com', password: 'password123', name: 'Dave' },
    })
    const refreshCookie = regRes.cookies.find((c) => c.name === 'refreshToken')!

    const res = await server.inject({
      method: 'DELETE',
      url: '/auth/logout',
      cookies: { refreshToken: refreshCookie.value },
    })

    expect(res.statusCode).toBe(204)
    const clearedCookie = res.cookies.find((c) => c.name === 'refreshToken')
    // Cookie is cleared (maxAge 0 or expires in the past)
    expect(clearedCookie?.value).toBe('')
  })

  it('returns 204 even when no refreshToken cookie is present', async () => {
    const res = await server.inject({ method: 'DELETE', url: '/auth/logout' })
    expect(res.statusCode).toBe(204)
  })
})
```

**Step 2: Run integration test to verify it fails**

```bash
pnpm --filter api vitest run --config vitest.integration.config.ts \
  src/modules/auth/tests/auth.integration.test.ts
```

Expected: FAIL — `auth.routes.ts` does not exist yet, causing an import error, or if the file exists as a stub all route tests return 404.

**Step 3: Implement**

Before implementing routes, ensure the global error handler in `buildServer` maps domain errors to HTTP status codes. Add the following to `apps/api/src/infrastructure/server.ts` (or wherever `buildServer` is defined) if not already present:

```ts
// apps/api/src/infrastructure/server.ts
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidTokenError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../shared/errors.js'
import type { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: { userId: string; email: string }
  }
}

export interface ServerOptions {
  jwtSecret: string
  corsOrigin: string
}

export function buildServer(options: ServerOptions): FastifyInstance {
  const fastify = Fastify({ logger: true })

  fastify.register(fastifyCookie)
  fastify.register(fastifyJwt, { secret: options.jwtSecret })

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ message: 'Unauthorized' })
    }
  })

  // Global error handler — maps domain errors to HTTP status codes
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof EmailAlreadyExistsError) {
      return reply.code(409).send({ message: error.message })
    }
    if (error instanceof InvalidCredentialsError) {
      return reply.code(401).send({ message: error.message })
    }
    if (error instanceof InvalidTokenError) {
      return reply.code(401).send({ message: error.message })
    }
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ message: error.message })
    }
    if (error instanceof ForbiddenError) {
      return reply.code(403).send({ message: error.message })
    }
    if (error instanceof ValidationError) {
      return reply.code(400).send({ message: error.message })
    }
    // ZodError from schema.parse() — Zod throws ZodError instances
    if (error.name === 'ZodError') {
      return reply.code(400).send({ message: 'Validation failed', issues: (error as any).issues })
    }
    fastify.log.error(error)
    return reply.code(500).send({ message: 'Internal server error' })
  })

  return fastify
}
```

Now implement the routes:

`apps/api/src/modules/auth/adapters/http/auth.routes.ts`:
```ts
import type { FastifyInstance } from 'fastify'
import { registerRequestSchema, loginRequestSchema } from '@repo/contracts'
import type { RegisterUseCase } from '../../application/register.use-case.js'
import type { LoginUseCase } from '../../application/login.use-case.js'
import type { RefreshTokenUseCase } from '../../application/refresh-token.use-case.js'
import type { LogoutUseCase } from '../../application/logout.use-case.js'

const REFRESH_COOKIE = 'refreshToken'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
}

export interface AuthUseCases {
  register: RegisterUseCase
  login: LoginUseCase
  refresh: RefreshTokenUseCase
  logout: LogoutUseCase
}

export function registerAuthRoutes(fastify: FastifyInstance, useCases: AuthUseCases): void {
  fastify.post('/auth/register', async (request, reply) => {
    const dto = registerRequestSchema.parse(request.body)
    const result = await useCases.register.execute(dto)
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
    return reply.code(201).send({ accessToken: result.accessToken, user: result.user })
  })

  fastify.post('/auth/login', async (request, reply) => {
    const dto = loginRequestSchema.parse(request.body)
    const result = await useCases.login.execute(dto)
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
    return reply.send({ accessToken: result.accessToken, user: result.user })
  })

  fastify.post('/auth/refresh', async (request, reply) => {
    const token = (request.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
    if (!token) {
      return reply.code(401).send({ message: 'No refresh token' })
    }
    const result = await useCases.refresh.execute(token)
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
    return reply.send({ accessToken: result.accessToken })
  })

  fastify.delete('/auth/logout', async (request, reply) => {
    const token = (request.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
    if (token) {
      await useCases.logout.execute(token)
    }
    reply.clearCookie(REFRESH_COOKIE, { path: '/' })
    return reply.code(204).send()
  })
}
```

**Step 4: Run integration tests to verify they pass**

```bash
pnpm --filter api vitest run --config vitest.integration.config.ts \
  src/modules/auth/tests/auth.integration.test.ts
```

Expected: PASS — all route tests pass against a real Postgres container.

**Step 5: Commit**

```bash
git add apps/api/src/modules/auth/adapters/http/auth.routes.ts \
        apps/api/src/modules/auth/tests/auth.integration.test.ts \
        apps/api/src/infrastructure/server.ts
git commit -m "feat(auth): add auth HTTP routes and integration tests"
```

---

### Task 10: User module (GetProfile, UpdateProfile, UpdatePreferences, ChangePassword)

**Files:**
- Create: `apps/api/src/modules/user/ports/user-preferences.repository.port.ts`
- Create: `apps/api/src/modules/user/application/get-profile.use-case.ts`
- Create: `apps/api/src/modules/user/application/get-profile.use-case.test.ts`
- Create: `apps/api/src/modules/user/application/update-profile.use-case.ts`
- Create: `apps/api/src/modules/user/application/update-profile.use-case.test.ts`
- Create: `apps/api/src/modules/user/application/update-preferences.use-case.ts`
- Create: `apps/api/src/modules/user/application/update-preferences.use-case.test.ts`
- Create: `apps/api/src/modules/user/application/change-password.use-case.ts`
- Create: `apps/api/src/modules/user/application/change-password.use-case.test.ts`
- Create: `apps/api/src/modules/user/adapters/prisma/prisma-user-preferences.repository.ts`
- Create: `apps/api/src/modules/user/adapters/http/user.routes.ts`
- Create: `apps/api/src/modules/user/tests/user.integration.test.ts`

**Step 1: Write failing tests**

Create the port file and all stub use-case files so the tests compile but fail.

`apps/api/src/modules/user/ports/user-preferences.repository.port.ts`:
```ts
export interface IUserPreferencesRepository {
  findByUserId(userId: string): Promise<{ theme: 'LIGHT' | 'DARK'; language: string } | null>
  upsert(
    userId: string,
    data: { theme?: 'LIGHT' | 'DARK'; language?: string },
  ): Promise<{ theme: 'LIGHT' | 'DARK'; language: string }>
}
```

`apps/api/src/modules/user/application/get-profile.use-case.ts` (stub):
```ts
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

export interface GetProfileResult {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  preferences: { theme: 'LIGHT' | 'DARK'; language: string } | null
}

export class GetProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly prefsRepo: IUserPreferencesRepository,
  ) {}

  async execute(_userId: string): Promise<GetProfileResult> {
    throw new Error('Not implemented')
  }
}
```

`apps/api/src/modules/user/application/update-profile.use-case.ts` (stub):
```ts
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

export interface UpdateProfileDto {
  userId: string
  name?: string
  avatarUrl?: string | null
}

export interface UpdateProfileResult {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(_dto: UpdateProfileDto): Promise<UpdateProfileResult> {
    throw new Error('Not implemented')
  }
}
```

`apps/api/src/modules/user/application/update-preferences.use-case.ts` (stub):
```ts
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

export interface UpdatePreferencesDto {
  userId: string
  theme?: 'LIGHT' | 'DARK'
  language?: string
}

export interface UpdatePreferencesResult {
  theme: 'LIGHT' | 'DARK'
  language: string
}

export class UpdatePreferencesUseCase {
  constructor(private readonly prefsRepo: IUserPreferencesRepository) {}

  async execute(_dto: UpdatePreferencesDto): Promise<UpdatePreferencesResult> {
    throw new Error('Not implemented')
  }
}
```

`apps/api/src/modules/user/application/change-password.use-case.ts` (stub):
```ts
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

export interface ChangePasswordDto {
  userId: string
  currentPassword: string
  newPassword: string
}

export class ChangePasswordUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(_dto: ChangePasswordDto): Promise<void> {
    throw new Error('Not implemented')
  }
}
```

Now write all four unit test files:

`apps/api/src/modules/user/application/get-profile.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetProfileUseCase } from './get-profile.use-case.js'
import { NotFoundError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const mockPrefsRepo: IUserPreferencesRepository = {
  findByUserId: vi.fn(),
  upsert: vi.fn(),
}

const existingUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  name: 'Test User',
  avatarUrl: null,
}

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new GetProfileUseCase(mockUserRepo, mockPrefsRepo)
  })

  it('returns combined profile with preferences', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)
    vi.mocked(mockPrefsRepo.findByUserId).mockResolvedValue({ theme: 'DARK', language: 'en' })

    const result = await useCase.execute('user-1')

    expect(result.id).toBe('user-1')
    expect(result.email).toBe('test@example.com')
    expect(result.preferences?.theme).toBe('DARK')
  })

  it('returns null preferences when none are stored', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)
    vi.mocked(mockPrefsRepo.findByUserId).mockResolvedValue(null)

    const result = await useCase.execute('user-1')

    expect(result.preferences).toBeNull()
  })

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(null)

    await expect(useCase.execute('nonexistent-id')).rejects.toThrow(NotFoundError)
  })
})
```

`apps/api/src/modules/user/application/update-profile.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateProfileUseCase } from './update-profile.use-case.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new UpdateProfileUseCase(mockUserRepo)
  })

  it('updates user name and returns updated profile', async () => {
    vi.mocked(mockUserRepo.update).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'New Name',
      avatarUrl: null,
    })

    const result = await useCase.execute({ userId: 'user-1', name: 'New Name' })

    expect(result.name).toBe('New Name')
    expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { name: 'New Name' })
  })

  it('updates avatarUrl when provided', async () => {
    vi.mocked(mockUserRepo.update).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    })

    const result = await useCase.execute({
      userId: 'user-1',
      avatarUrl: 'https://example.com/avatar.png',
    })

    expect(result.avatarUrl).toBe('https://example.com/avatar.png')
    expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
      avatarUrl: 'https://example.com/avatar.png',
    })
  })
})
```

`apps/api/src/modules/user/application/update-preferences.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdatePreferencesUseCase } from './update-preferences.use-case.js'
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

const mockPrefsRepo: IUserPreferencesRepository = {
  findByUserId: vi.fn(),
  upsert: vi.fn(),
}

describe('UpdatePreferencesUseCase', () => {
  let useCase: UpdatePreferencesUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new UpdatePreferencesUseCase(mockPrefsRepo)
  })

  it('upserts preferences and returns the updated record', async () => {
    vi.mocked(mockPrefsRepo.upsert).mockResolvedValue({ theme: 'DARK', language: 'fr' })

    const result = await useCase.execute({ userId: 'user-1', theme: 'DARK', language: 'fr' })

    expect(result.theme).toBe('DARK')
    expect(result.language).toBe('fr')
    expect(mockPrefsRepo.upsert).toHaveBeenCalledWith('user-1', { theme: 'DARK', language: 'fr' })
  })

  it('passes only provided fields to upsert', async () => {
    vi.mocked(mockPrefsRepo.upsert).mockResolvedValue({ theme: 'LIGHT', language: 'en' })

    await useCase.execute({ userId: 'user-1', theme: 'LIGHT' })

    expect(mockPrefsRepo.upsert).toHaveBeenCalledWith('user-1', { theme: 'LIGHT' })
  })
})
```

`apps/api/src/modules/user/application/change-password.use-case.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChangePasswordUseCase } from './change-password.use-case.js'
import { InvalidCredentialsError, NotFoundError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const existingUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-current-password',
  name: 'Test User',
  avatarUrl: null,
}

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new ChangePasswordUseCase(mockUserRepo)
  })

  it('updates passwordHash when current password matches', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)
    vi.mocked(mockUserRepo.update).mockResolvedValue({ ...existingUser, passwordHash: 'new-hash' })

    const bcrypt = await import('bcryptjs')
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never)

    await useCase.execute({
      userId: 'user-1',
      currentPassword: 'current-password',
      newPassword: 'new-password123',
    })

    expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { passwordHash: 'new-hash' })
  })

  it('throws InvalidCredentialsError when current password does not match', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)

    const bcrypt = await import('bcryptjs')
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

    await expect(
      useCase.execute({
        userId: 'user-1',
        currentPassword: 'wrong-password',
        newPassword: 'new-password123',
      }),
    ).rejects.toThrow(InvalidCredentialsError)

    expect(mockUserRepo.update).not.toHaveBeenCalled()
  })

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(null)

    await expect(
      useCase.execute({
        userId: 'nonexistent',
        currentPassword: 'current-password',
        newPassword: 'new-password123',
      }),
    ).rejects.toThrow(NotFoundError)
  })
})
```

**Step 2: Run unit tests to verify they fail**

```bash
pnpm --filter api vitest run \
  src/modules/user/application/get-profile.use-case.test.ts \
  src/modules/user/application/update-profile.use-case.test.ts \
  src/modules/user/application/update-preferences.use-case.test.ts \
  src/modules/user/application/change-password.use-case.test.ts
```

Expected: FAIL — all `execute` methods throw `Error('Not implemented')`.

**Step 3: Implement all use-cases and adapters**

`apps/api/src/modules/user/application/get-profile.use-case.ts`:
```ts
import { NotFoundError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

export interface GetProfileResult {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  preferences: { theme: 'LIGHT' | 'DARK'; language: string } | null
}

export class GetProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly prefsRepo: IUserPreferencesRepository,
  ) {}

  async execute(userId: string): Promise<GetProfileResult> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`)
    }

    const preferences = await this.prefsRepo.findByUserId(userId)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      preferences,
    }
  }
}
```

`apps/api/src/modules/user/application/update-profile.use-case.ts`:
```ts
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

export interface UpdateProfileDto {
  userId: string
  name?: string
  avatarUrl?: string | null
}

export interface UpdateProfileResult {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(dto: UpdateProfileDto): Promise<UpdateProfileResult> {
    const updateData: { name?: string; avatarUrl?: string | null } = {}

    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl

    const user = await this.userRepo.update(dto.userId, updateData)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }
  }
}
```

`apps/api/src/modules/user/application/update-preferences.use-case.ts`:
```ts
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

export interface UpdatePreferencesDto {
  userId: string
  theme?: 'LIGHT' | 'DARK'
  language?: string
}

export interface UpdatePreferencesResult {
  theme: 'LIGHT' | 'DARK'
  language: string
}

export class UpdatePreferencesUseCase {
  constructor(private readonly prefsRepo: IUserPreferencesRepository) {}

  async execute(dto: UpdatePreferencesDto): Promise<UpdatePreferencesResult> {
    const updateData: { theme?: 'LIGHT' | 'DARK'; language?: string } = {}

    if (dto.theme !== undefined) updateData.theme = dto.theme
    if (dto.language !== undefined) updateData.language = dto.language

    return this.prefsRepo.upsert(dto.userId, updateData)
  }
}
```

`apps/api/src/modules/user/application/change-password.use-case.ts`:
```ts
import bcrypt from 'bcryptjs'
import { NotFoundError, InvalidCredentialsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

export interface ChangePasswordDto {
  userId: string
  currentPassword: string
  newPassword: string
}

export class ChangePasswordUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(dto.userId)
    if (!user) {
      throw new NotFoundError(`User ${dto.userId} not found`)
    }

    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError('Current password is incorrect')
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.userRepo.update(dto.userId, { passwordHash: newPasswordHash })
  }
}
```

`apps/api/src/modules/user/adapters/prisma/prisma-user-preferences.repository.ts`:
```ts
import type { PrismaClient } from '@repo/db'
import type { IUserPreferencesRepository } from '../../ports/user-preferences.repository.port.js'

export class PrismaUserPreferencesRepository implements IUserPreferencesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<{ theme: 'LIGHT' | 'DARK'; language: string } | null> {
    const prefs = await this.prisma.userPreferences.findUnique({ where: { userId } })
    if (!prefs) return null
    return { theme: prefs.theme as 'LIGHT' | 'DARK', language: prefs.language }
  }

  async upsert(
    userId: string,
    data: { theme?: 'LIGHT' | 'DARK'; language?: string },
  ): Promise<{ theme: 'LIGHT' | 'DARK'; language: string }> {
    const prefs = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        theme: data.theme ?? 'LIGHT',
        language: data.language ?? 'en',
      },
    })
    return { theme: prefs.theme as 'LIGHT' | 'DARK', language: prefs.language }
  }
}
```

Now implement the HTTP routes with authentication middleware:

`apps/api/src/modules/user/adapters/http/user.routes.ts`:
```ts
import type { FastifyInstance } from 'fastify'
import {
  updateProfileRequestSchema,
  updatePreferencesRequestSchema,
  changePasswordRequestSchema,
} from '@repo/contracts'
import type { GetProfileUseCase } from '../../application/get-profile.use-case.js'
import type { UpdateProfileUseCase } from '../../application/update-profile.use-case.js'
import type { UpdatePreferencesUseCase } from '../../application/update-preferences.use-case.js'
import type { ChangePasswordUseCase } from '../../application/change-password.use-case.js'

export interface UserUseCases {
  getProfile: GetProfileUseCase
  updateProfile: UpdateProfileUseCase
  updatePreferences: UpdatePreferencesUseCase
  changePassword: ChangePasswordUseCase
}

export function registerUserRoutes(fastify: FastifyInstance, useCases: UserUseCases): void {
  const authenticate = { preHandler: [fastify.authenticate] }

  fastify.get('/users/me', authenticate, async (request, reply) => {
    const { userId } = request.user
    const profile = await useCases.getProfile.execute(userId)
    return reply.send(profile)
  })

  fastify.patch('/users/me', authenticate, async (request, reply) => {
    const { userId } = request.user
    const dto = updateProfileRequestSchema.parse(request.body)
    const updated = await useCases.updateProfile.execute({ userId, ...dto })
    return reply.send(updated)
  })

  fastify.patch('/users/me/preferences', authenticate, async (request, reply) => {
    const { userId } = request.user
    const dto = updatePreferencesRequestSchema.parse(request.body)
    const prefs = await useCases.updatePreferences.execute({ userId, ...dto })
    return reply.send(prefs)
  })

  fastify.patch('/users/me/password', authenticate, async (request, reply) => {
    const { userId } = request.user
    const dto = changePasswordRequestSchema.parse(request.body)
    await useCases.changePassword.execute({ userId, ...dto })
    return reply.code(204).send()
  })
}
```

Now write the integration test:

`apps/api/src/modules/user/tests/user.integration.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'
import { createPrismaClient } from '@repo/db'
import { buildServer } from '../../../infrastructure/server.js'
import { PrismaUserRepository } from '../../auth/adapters/prisma/prisma-user.repository.js'
import { PrismaRefreshTokenRepository } from '../../auth/adapters/prisma/prisma-refresh-token.repository.js'
import { PrismaUserPreferencesRepository } from '../adapters/prisma/prisma-user-preferences.repository.js'
import { JwtTokenService } from '../../auth/adapters/jwt/jwt-token.service.js'
import { RegisterUseCase } from '../../auth/application/register.use-case.js'
import { LoginUseCase } from '../../auth/application/login.use-case.js'
import { RefreshTokenUseCase } from '../../auth/application/refresh-token.use-case.js'
import { LogoutUseCase } from '../../auth/application/logout.use-case.js'
import { GetProfileUseCase } from '../application/get-profile.use-case.js'
import { UpdateProfileUseCase } from '../application/update-profile.use-case.js'
import { UpdatePreferencesUseCase } from '../application/update-preferences.use-case.js'
import { ChangePasswordUseCase } from '../application/change-password.use-case.js'
import { registerAuthRoutes } from '../../auth/adapters/http/auth.routes.js'
import { registerUserRoutes } from '../adapters/http/user.routes.js'
import type { FastifyInstance } from 'fastify'

let container: Awaited<ReturnType<typeof new PostgreSqlContainer().start>>
let prisma: ReturnType<typeof createPrismaClient>
let server: FastifyInstance

const JWT_SECRET = 'user-integration-test-secret'

// Helper to register a user and return the access token
async function registerUser(
  srv: FastifyInstance,
  email: string,
  password: string,
  name: string,
): Promise<{ accessToken: string; userId: string }> {
  const res = await srv.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password, name },
  })
  const body = res.json()
  return { accessToken: body.accessToken, userId: body.user.id }
}

beforeAll(async () => {
  container = await new PostgreSqlContainer().start()
  const url = container.getConnectionUri()

  execSync(`pnpm --filter @repo/db prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })

  prisma = createPrismaClient(url)

  const userRepo = new PrismaUserRepository(prisma)
  const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma)
  const prefsRepo = new PrismaUserPreferencesRepository(prisma)
  const tokenService = new JwtTokenService(JWT_SECRET)

  server = buildServer({ jwtSecret: JWT_SECRET, corsOrigin: '*' })

  registerAuthRoutes(server, {
    register: new RegisterUseCase(userRepo, tokenService, refreshTokenRepo),
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

  await server.ready()
}, 60_000)

afterAll(async () => {
  await server.close()
  await prisma.$disconnect()
  await container.stop()
})

beforeEach(async () => {
  await prisma.userPreferences.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

describe('GET /users/me', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await server.inject({ method: 'GET', url: '/users/me' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 with user profile when authenticated', async () => {
    const { accessToken } = await registerUser(server, 'alice@example.com', 'password123', 'Alice')

    const res = await server.inject({
      method: 'GET',
      url: '/users/me',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.email).toBe('alice@example.com')
    expect(body.name).toBe('Alice')
    expect(body.preferences).toBeNull()
  })
})

describe('PATCH /users/me', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { name: 'New Name' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('updates the user name and returns 200 with updated profile', async () => {
    const { accessToken } = await registerUser(server, 'bob@example.com', 'password123', 'Bob')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { name: 'Bobby' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Bobby')
  })
})

describe('PATCH /users/me/preferences', () => {
  it('creates or updates preferences and returns 200', async () => {
    const { accessToken } = await registerUser(server, 'carol@example.com', 'password123', 'Carol')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/preferences',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { theme: 'DARK' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().theme).toBe('DARK')
  })

  it('returns 401 without an Authorization header', async () => {
    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/preferences',
      payload: { theme: 'DARK' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('PATCH /users/me/password', () => {
  it('returns 204 on successful password change', async () => {
    const { accessToken } = await registerUser(server, 'dave@example.com', 'oldpassword', 'Dave')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/password',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { currentPassword: 'oldpassword', newPassword: 'newpassword123' },
    })

    expect(res.statusCode).toBe(204)
  })

  it('returns 401 when current password is wrong', async () => {
    const { accessToken } = await registerUser(server, 'eve@example.com', 'correctpassword', 'Eve')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/password',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { currentPassword: 'wrongpassword', newPassword: 'newpassword123' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('returns 401 without an Authorization header', async () => {
    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/password',
      payload: { currentPassword: 'oldpassword', newPassword: 'newpassword123' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('allows login with new password after change', async () => {
    const { accessToken } = await registerUser(
      server,
      'frank@example.com',
      'oldpassword',
      'Frank',
    )

    await server.inject({
      method: 'PATCH',
      url: '/users/me/password',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { currentPassword: 'oldpassword', newPassword: 'newpassword123' },
    })

    const loginRes = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'frank@example.com', password: 'newpassword123' },
    })

    expect(loginRes.statusCode).toBe(200)
    expect(loginRes.json().accessToken).toBeDefined()
  })
})
```

**Step 4: Run unit tests to verify they pass**

```bash
pnpm --filter api vitest run \
  src/modules/user/application/get-profile.use-case.test.ts \
  src/modules/user/application/update-profile.use-case.test.ts \
  src/modules/user/application/update-preferences.use-case.test.ts \
  src/modules/user/application/change-password.use-case.test.ts
```

Expected: PASS — all use-case unit tests pass.

**Step 5: Run integration test to verify it fails (routes not registered yet)**

At this point the integration test file exists but the user routes have not been registered in the server fixture — the test itself includes the `registerUserRoutes` call so this step verifies the test fails only when routes are absent, which has already been addressed by including registration inside `beforeAll`. Run as a sanity check:

```bash
pnpm --filter api vitest run --config vitest.integration.config.ts \
  src/modules/user/tests/user.integration.test.ts
```

Expected: FAIL — the Prisma adapter may be missing or the `userPreferences` model not yet in the schema. Once the DB schema includes `UserPreferences`, the test proceeds.

**Step 6: Run integration test to verify it passes after full implementation**

```bash
pnpm --filter api vitest run --config vitest.integration.config.ts \
  src/modules/user/tests/user.integration.test.ts
```

Expected: PASS — all user route integration tests pass.

**Step 7: Commit**

```bash
git add apps/api/src/modules/user/ports/user-preferences.repository.port.ts \
        apps/api/src/modules/user/application/get-profile.use-case.ts \
        apps/api/src/modules/user/application/get-profile.use-case.test.ts \
        apps/api/src/modules/user/application/update-profile.use-case.ts \
        apps/api/src/modules/user/application/update-profile.use-case.test.ts \
        apps/api/src/modules/user/application/update-preferences.use-case.ts \
        apps/api/src/modules/user/application/update-preferences.use-case.test.ts \
        apps/api/src/modules/user/application/change-password.use-case.ts \
        apps/api/src/modules/user/application/change-password.use-case.test.ts \
        apps/api/src/modules/user/adapters/prisma/prisma-user-preferences.repository.ts \
        apps/api/src/modules/user/adapters/http/user.routes.ts \
        apps/api/src/modules/user/tests/user.integration.test.ts
git commit -m "feat(user): add user module with profile and preferences"
```
