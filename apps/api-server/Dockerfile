FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install
RUN pnpm --filter api-server build

# --- Imagem Final ---
FROM node:20-alpine
WORKDIR /app

# 1. Copia os ficheiros de definição de dependências
COPY package.json pnpm-lock.yaml ./

# 2. Instala o pnpm e as dependências de PRODUÇÃO (sem devDependencies)
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# 3. Copia o código compilado do builder
COPY --from=builder /app/apps/api-server/dist ./dist

CMD ["node", "dist/main.js"]