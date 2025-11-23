# Etapa 1: Construir (Build)
FROM node:20-alpine as builder
WORKDIR /app

# Copia tudo da raiz
COPY . .

# Instala dependências
RUN npm install -g pnpm && pnpm install

# Constrói apenas o cliente
RUN pnpm --filter client build

# Etapa 2: Servir com Caddy
FROM caddy:2-alpine

# << 🔥 A CORREÇÃO ESTÁ AQUI 🔥 >>
# O caminho correto depois do build é: /app/apps/client/dist
COPY --from=builder /app/apps/client/dist /usr/share/caddy

# Copia o Caddyfile da pasta correta
COPY --from=builder /app/apps/client/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443