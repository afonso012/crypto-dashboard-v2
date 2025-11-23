# Etapa 1: Construir o React
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# Etapa 2: Servidor Web (Caddy)
FROM caddy:2-alpine
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile