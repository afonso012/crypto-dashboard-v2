FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/api-server/package.json ./apps/api-server/
COPY libs ./libs

RUN pnpm install --frozen-lockfile

COPY . .

# Constrói a app (Output vai para apps/api-server/dist)
RUN pnpm --filter api-server build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm

# Copiar dependências da raiz (porque é um monorepo)
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

# 🔥 CORREÇÃO: Copiar o dist da pasta ESPECÍFICA da app
COPY --from=builder /usr/src/app/apps/api-server/dist ./dist

EXPOSE 3000

# 🔥 CORREÇÃO: Ajustar o caminho do main
CMD ["node", "dist/main"]