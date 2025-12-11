FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY libs ./libs
COPY apps/client/package.json ./apps/client/

RUN pnpm install --frozen-lockfile

COPY . .

# 🔥 CORREÇÃO: Sintaxe correta do filtro pnpm
RUN pnpm --filter client build

# --- Production Stage ---
FROM caddy:2-alpine
COPY --from=builder /usr/src/app/apps/client/dist /usr/share/caddy
COPY --from=builder /usr/src/app/apps/client/Caddyfile /etc/caddy/Caddyfile