FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter data-collector build
# 🔥 Prepara a pasta de produção para o data-collector
RUN pnpm --filter data-collector deploy --prod /prod/data-collector

FROM base AS runner
WORKDIR /app

# 1. Copia as dependências preparadas
COPY --from=builder /prod/data-collector ./

# 2. Copia o código compilado
COPY --from=builder /app/apps/data-collector/dist ./dist

CMD ["node", "dist/main.js"]