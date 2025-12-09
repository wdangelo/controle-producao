#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
sleep 5

echo "🗄️ Rodando migrations..."
cd /app
node_modules/.bin/prisma migrate deploy

echo "🌱 Populando banco (seed)..."
node_modules/.bin/tsx prisma/seed.ts || echo "⚠️ Seed falhou ou já foi executado"

echo "🚀 Iniciando aplicação..."
exec node server.js
