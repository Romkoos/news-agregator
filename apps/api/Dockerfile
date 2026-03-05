FROM node:24-alpine AS builder
WORKDIR /app

# Copy workspace manifests and lockfile so pnpm can resolve the graph
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN corepack enable && pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @repo/db db:generate

# Build API bundle
RUN pnpm --filter api build

FROM node:24-alpine AS runner
WORKDIR /app

# Install only the Prisma CLI for the migration step at startup
RUN corepack enable

COPY --from=builder /app/apps/api/dist/main.js ./main.js
COPY --from=builder /app/packages/db/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production
EXPOSE 3001

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node main.js"]
