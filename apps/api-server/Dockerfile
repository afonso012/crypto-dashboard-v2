# Usa uma imagem base com pnpm ativado
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Etapa de Construção
FROM base AS builder
WORKDIR /app
COPY . .
# Instala TUDO (necessário para o build)
RUN pnpm install --frozen-lockfile
# Compila o código
RUN pnpm --filter api-server build
# 🔥 A MAGIA: Cria uma pasta /prod/api-server pronta para produção
# Isto isola as dependências e remove o que não é necessário
RUN pnpm --filter api-server deploy --prod /prod/api-server

# Etapa Final (Runner)
FROM base AS runner
WORKDIR /app

# 1. Copia a aplicação preparada (já traz os node_modules corretos!)
COPY --from=builder /prod/api-server ./

# 2. Copia o código compilado (dist) que criámos no builder
COPY --from=builder /app/apps/api-server/dist ./dist

CMD ["node", "dist/main.js"]