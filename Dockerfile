# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (disable SSL strict for corporate networks)
RUN npm config set strict-ssl false && \
    npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable SSL for Prisma binary download (corporate networks)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create entrypoint script inline to avoid Windows CRLF issues
RUN echo '#!/bin/sh' > /usr/local/bin/docker-entrypoint.sh && \
    echo 'set -e' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "🔄 Aguardando banco de dados..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'sleep 5' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "🗄️ Rodando migrations..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'cd /app' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'node_modules/.bin/prisma migrate deploy' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "🌱 Populando banco (seed)..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'node_modules/.bin/tsx prisma/seed.ts || echo "⚠️ Seed falhou ou já foi executado"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "🚀 Iniciando aplicação..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'exec node server.js' >> /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
