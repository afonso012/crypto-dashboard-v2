FROM node:20-alpine AS builder
WORKDIR /app

# Copia tudo (a partir da raiz)
COPY . .

# Instala dependências na raiz (lê o pnpm-lock.yaml corretamente)
RUN npm install -g pnpm && pnpm install

# Constrói apenas o api-server
RUN pnpm --filter api-server build

# --- Imagem Final ---
FROM node:20-alpine
WORKDIR /app

# Copia os node_modules e o build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-server/dist ./dist

CMD ["node", "dist/main.js"]