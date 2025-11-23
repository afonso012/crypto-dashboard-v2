FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter data-collector build

# 🔥 CORREÇÃO: Adicionada a flag --legacy
RUN pnpm --filter data-collector deploy --prod --legacy /prod/data-collector

FROM base AS runner
WORKDIR /app

COPY --from=builder /prod/data-collector ./
COPY --from=builder /app/apps/data-collector/dist ./dist

CMD ["node", "dist/main.js"]