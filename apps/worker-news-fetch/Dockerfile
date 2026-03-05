FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY apps/worker-news-fetch/package.json ./apps/worker-news-fetch/

RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/worker-news-fetch/ ./apps/worker-news-fetch/

RUN pnpm --filter @repo/db db:generate
RUN pnpm --filter worker-news-fetch build

FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/worker-news-fetch/dist/main.js ./main.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production

CMD ["node", "main.js"]
