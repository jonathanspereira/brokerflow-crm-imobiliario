# Dockerfile para rodar backend e frontend juntos
FROM node:20-alpine AS builder

WORKDIR /app

# Copia e instala dependências do backend
COPY crm_imob_backend/package*.json ./crm_imob_backend/
COPY crm_imob_backend/prisma ./crm_imob_backend/prisma
RUN apk add --no-cache python3 make g++
RUN cd crm_imob_backend && npm install --legacy-peer-deps && npx prisma generate

# Copia código do backend
COPY crm_imob_backend/src ./crm_imob_backend/src
COPY crm_imob_backend/tsconfig.json ./crm_imob_backend/
RUN cd crm_imob_backend && npm run build

# Copia e instala dependências do frontend
COPY crm_imob_frontend/package*.json ./crm_imob_frontend/
RUN cd crm_imob_frontend && npm install
COPY crm_imob_frontend .//crm_imob_frontend
RUN cd crm_imob_frontend && npm run build

# Stage de produção
FROM node:20-alpine

WORKDIR /app

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copia backend buildado
COPY --from=builder /app/crm_imob_backend/package*.json ./crm_imob_backend/
COPY --from=builder /app/crm_imob_backend/node_modules ./crm_imob_backend/node_modules
COPY --from=builder /app/crm_imob_backend/dist ./crm_imob_backend/dist
COPY --from=builder /app/crm_imob_backend/prisma ./crm_imob_backend/prisma

# Copia frontend buildado
COPY --from=builder /app/crm_imob_frontend/package*.json ./crm_imob_frontend/
COPY --from=builder /app/crm_imob_frontend/node_modules ./crm_imob_frontend/node_modules
COPY --from=builder /app/crm_imob_frontend/.next ./crm_imob_frontend/.next
COPY --from=builder /app/crm_imob_frontend/public ./crm_imob_frontend/public
COPY --from=builder /app/crm_imob_frontend/next.config.js ./crm_imob_frontend/

# Copia script de inicialização
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

USER nodejs

EXPOSE 3000 3001

CMD ["./start.sh"]
