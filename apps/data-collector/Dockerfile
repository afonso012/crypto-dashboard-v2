FROM node:20-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install -g pnpm && pnpm install

# Constrói apenas o data-collector
RUN pnpm --filter data-collector build

# --- Imagem Final ---
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/data-collector/dist ./dist

CMD ["node", "dist/main.js"]