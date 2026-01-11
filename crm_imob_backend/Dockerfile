# Build Backend
FROM node:20-alpine@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2 AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma

# Dependências de build para módulos nativos (bcrypt)
RUN apk add --no-cache python3 make g++

# Configurar npm para melhor resiliência de rede
RUN printf "fetch-timeout=600000\nfetch-retries=10\nfetch-retry-mintimeout=20000\nfetch-retry-maxtimeout=120000\n" > .npmrc

# Instalar todas dependências (dev + prod) e gerar Prisma Client
RUN npm install --legacy-peer-deps && \
    npx prisma generate

# Copiar código fonte
COPY src ./src
COPY tsconfig.json .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2

WORKDIR /app

# Criar usuário non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
COPY prisma ./prisma

# Reutilizar node_modules do builder para evitar recompilar bcrypt
COPY --from=builder /app/node_modules ./node_modules

# Remover dependências de dev e reduzir tamanho (pulado para evitar conflitos de peer deps)
# COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Mudar ownership para o usuário non-root
RUN chown -R nodejs:nodejs /app

# Trocar para usuário non-root
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode); })"

CMD ["node", "dist/index.js"]
