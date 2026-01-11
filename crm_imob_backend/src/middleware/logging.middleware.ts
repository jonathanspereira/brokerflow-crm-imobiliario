import { Request, Response, NextFunction } from "express"
import { Logger } from "../utils/helpers"

const logger = new Logger("RequestLogger")

/**
 * Middleware para logging estruturado de requisições e respostas
 * Em desenvolvimento: formato legível
 * Em produção: JSON estruturado
 */
export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now()
  const requestId = req.headers["x-request-id"] as string || generateRequestId()

  // Adicionar ID da requisição ao contexto
  ;(req as any).requestId = requestId

  // Logar requisição recebida
  logger.debug("Requisição recebida", {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  })

  // Interceptar a resposta original
  const originalSend = res.send

  res.send = function (data: any) {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode

    // Logar resposta
    logger.log(`${req.method} ${req.path} ${statusCode}`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    })

    // Para erros 4xx e 5xx, logar com warn/error
    if (statusCode >= 500) {
      logger.error(`Server error: ${req.method} ${req.path}`, {
        requestId,
        statusCode,
        duration: `${duration}ms`,
      })
    } else if (statusCode >= 400) {
      logger.warn(`Client error: ${req.method} ${req.path}`, {
        requestId,
        statusCode,
        duration: `${duration}ms`,
      })
    }

    return originalSend.call(this, data)
  }

  next()
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
