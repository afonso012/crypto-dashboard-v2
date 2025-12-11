FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/data-collector/package.json ./apps/data-collector/
COPY libs ./libs

RUN pnpm install --frozen-lockfile

COPY . .

# Constrói a app (Output vai para apps/data-collector/dist)
RUN pnpm --filter data-collector build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

# 🔥 CORREÇÃO: Copiar o dist da pasta ESPECÍFICA da app
COPY --from=builder /usr/src/app/apps/data-collector/dist ./dist

# 🔥 CORREÇÃO: Ajustar o caminho do main
CMD ["node", "dist/main"]