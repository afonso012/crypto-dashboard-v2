FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api-server build

# 🔥 CORREÇÃO: Adicionada a flag --legacy
RUN pnpm --filter api-server deploy --prod --legacy /prod/api-server

FROM base AS runner
WORKDIR /app

COPY --from=builder /prod/api-server ./
COPY --from=builder /app/apps/api-server/dist ./dist

CMD ["node", "dist/main.js"]