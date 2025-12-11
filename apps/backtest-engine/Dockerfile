FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .

# 🔥 CORREÇÃO: Usar 'npx nx' em vez de 'pnpm nx'
RUN npx nx build backtest-engine

FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod

COPY --from=builder /app/dist/apps/backtest-engine ./dist/apps/backtest-engine
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/apps/backtest-engine/main.js"]