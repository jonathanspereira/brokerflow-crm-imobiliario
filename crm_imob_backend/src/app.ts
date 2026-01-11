import express from "express"
import * as Sentry from "@sentry/node"
import cors, { CorsOptions } from "cors"
import helmet from "helmet"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import swaggerUi from "swagger-ui-express"
import { config } from "./config/index"
import { Logger } from "./utils/helpers"
import { specs } from "./swagger"
import routes from "./routes/index"
import { errorHandler, notFoundHandler } from "./middleware/error.middleware"
import { requestLoggingMiddleware } from "./middleware/logging.middleware"

const logger = new Logger("App")

const app = express()
// Sentry: inicializar se DSN estiver configurado
if (config.sentryDsn) {
  Sentry.init({ dsn: config.sentryDsn, environment: config.nodeEnv })
  // Deve ser o primeiro middleware
  app.use(Sentry.Handlers.requestHandler())
}

// Security: Helmet.js - Define security headers
// Em produção, ser mais restritivo com CSP
const isDevelopment = config.nodeEnv === 'development'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDevelopment 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] // Swagger UI precisa em dev
        : ["'self'"], // Produção: sem unsafe-eval
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Evitar conflito com CORS
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xContentTypeOptions: true, // Adiciona X-Content-Type-Options: nosniff
  xFrameOptions: { action: "deny" }, // Adiciona X-Frame-Options: DENY
}))

// Rate Limiting: Prevenir brute-force e DDoS
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200, // Limite de 200 requests por minuto (aumentado para desenvolvimento)
  message: 'Muitas requisições deste IP, por favor tente novamente em alguns instantes',
  standardHeaders: true, // Retorna info de rate limit no `RateLimit-*` headers
  legacyHeaders: false, // Desabilita `X-RateLimit-*` headers
  keyGenerator: (req) => ipKeyGenerator(req.ip || ''), // IPv6-safe key generator
})

// Rate limiting mais restritivo para rotas de autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas de login
  message: 'Muitas tentativas de login. Por favor aguarde 15 minutos.',
  skipSuccessfulRequests: true, // Não conta requests bem-sucedidos
})

// Aplicar rate limiting global
app.use(limiter)

// Middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))

// Logging Middleware (antes de CORS para capturar todas as requisições)
app.use(requestLoggingMiddleware)

// CORS dinâmico: aceita múltiplos origins separados por vírgula
const allowedOrigins = config.corsOrigin.split(',').map(origin => origin.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (mobile apps, Postman, curl, etc)
    if (!origin) {
      return callback(null, true)
    }
    
    // Verificar se o origin está na lista permitida
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true)
    } else {
      logger.warn(`CORS bloqueado para origin: ${origin}`)
      callback(new Error(`Origin ${origin} não permitido por política CORS`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
} as CorsOptions))

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve)
app.get("/api-docs", swaggerUi.setup(specs, { swaggerOptions: { url: "/swagger.json" } }))
app.get("/swagger.json", (req, res) => {
  res.json(specs)
})

// Routes
app.use(`${config.apiPrefix}`, routes)

// Error handling
// Sentry error handler antes dos handlers customizados
if (config.sentryDsn) {
  app.use(Sentry.Handlers.errorHandler())
}
app.use(notFoundHandler)
app.use(errorHandler)

export default app
