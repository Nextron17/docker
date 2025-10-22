# --- Stage 1: Build ---
FROM node:18 AS builder
WORKDIR /app

# Copia archivos de definición de dependencias (npm)
COPY package*.json ./

# Instala dependencias usando npm ci (usa package-lock.json)
RUN npm ci

# Copia el resto del código fuente
COPY . .

# Construye la aplicación Next.js con npm
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]