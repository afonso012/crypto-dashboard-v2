FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .

# 🔥 CORREÇÃO: Usar 'nest' em vez de 'nx'
RUN npx nest build ai-optimizer

FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod

COPY --from=builder /app/dist/apps/ai-optimizer ./dist/apps/ai-optimizer
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/apps/ai-optimizer/main.js"]