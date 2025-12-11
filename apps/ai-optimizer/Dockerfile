FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# Instalar pnpm
RUN npm install -g pnpm
RUN pnpm install

COPY . .

# Construir a aplicação específica
RUN pnpm nx build ai-optimizer

FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod

# Copiar o build da fase anterior
COPY --from=builder /app/dist/apps/ai-optimizer ./dist/apps/ai-optimizer
COPY --from=builder /app/node_modules ./node_modules

# Definir comando de arranque
CMD ["node", "dist/apps/ai-optimizer/main.js"]