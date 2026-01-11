import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

// Validar variáveis críticas em produção
function getSecretOrFile(key: string): string | undefined {
  const direct = process.env[key]
  if (direct) return direct
  const filePath = process.env[`${key}_FILE`]
  if (filePath && fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath, "utf8").trim()
    } catch (err) {
      console.warn(`⚠️ Não foi possível ler ${key}_FILE em ${filePath}:`, err)
    }
  }
  return undefined
}

function getRequiredEnv(key: string, fallback?: string): string {
  const value = getSecretOrFile(key)
  if (!value && !fallback) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`❌ ERRO CRÍTICO: ${key} é obrigatório em produção`)
    }
    console.warn(`⚠️ ${key} não configurado, usando fallback`)
  }
  return value || fallback || ""
}

export const config = {
  port: parseInt(process.env.PORT || "3001"),
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Database
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  
  // WhatsApp Puppeteer
  whatsappHeadless: process.env.WHATSAPP_HEADLESS !== "false",
  whatsappDataPath: process.env.WHATSAPP_DATA_PATH || "./whatsapp_data",
  whatsappQrTimeout: parseInt(process.env.WHATSAPP_QR_TIMEOUT || "60000"),
  
  // JWT - CRÍTICO: Deve ser setado em produção
  jwtSecret: getRequiredEnv("JWT_SECRET", 
    process.env.NODE_ENV === "production" 
      ? undefined 
      : "dev_secret_key_change_in_production"),

  // Crypto - chave de 32 bytes (hex) para HMAC/AES
  encryptionKey: getRequiredEnv("ENCRYPTION_KEY", 
    process.env.NODE_ENV === "production"
      ? undefined
      : "0000000000000000000000000000000000000000000000000000000000000000"),

  // Refresh Tokens
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7"),
  accessTokenTtlMinutes: parseInt(process.env.ACCESS_TOKEN_TTL_MINUTES || "60"),

  // Sentry
  sentryDsn: process.env.SENTRY_DSN,
  // OpenTelemetry
  otelEnabled: process.env.OTEL_ENABLED === 'true',
  otelEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  otelServiceName: process.env.OTEL_SERVICE_NAME || 'crm-backend',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  
  // API
  apiVersion: "v1",
  apiPrefix: "/api/v1"
}
