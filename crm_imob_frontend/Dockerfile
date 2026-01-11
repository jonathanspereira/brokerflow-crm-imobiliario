FROM node:20-alpine@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2 AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./

# Configurar npm para melhor resiliência de rede
RUN printf "fetch-timeout=600000\nfetch-retries=10\nfetch-retry-mintimeout=20000\nfetch-retry-maxtimeout=120000\n" > .npmrc

RUN npm install

# Auditoria de segurança
RUN npm audit --audit-level=moderate || echo "Aviso: Vulnerabilidades encontradas"

# Build Next.js app
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2

WORKDIR /app

# Criar usuário non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Configurar npm para melhor resiliência de rede
RUN printf "fetch-timeout=600000\nfetch-retries=10\nfetch-retry-mintimeout=20000\nfetch-retry-maxtimeout=120000\n" > .npmrc

# Install only production dependencies
RUN npm install --omit=dev

# Copy built app from builder
COPY --from=builder /app/.next ./.next

# Mudar ownership para o usuário non-root
RUN chown -R nodejs:nodejs /app

# Trocar para usuário non-root
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["npm", "start"]
