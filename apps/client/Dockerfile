FROM node:20-alpine as builder
WORKDIR /app

COPY . .

RUN npm install -g pnpm && pnpm install

# Constrói apenas o client
RUN pnpm --filter client build

# --- Servidor Web ---
FROM caddy:2-alpine

# Atenção ao caminho da pasta dist (agora está dentro de apps/client)
COPY --from=builder /app/apps/client/dist /usr/share/caddy
COPY --from=builder /app/apps/client/Caddyfile /etc/caddy/Caddyfile