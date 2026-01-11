import { Request, Response, NextFunction } from "express"
import { Logger } from "../utils/helpers"

const logger = new Logger("ErrorHandler")

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Erro: ${err.message}`, err)

  const statusCode = err.statusCode || 500
  const message = err.message || "Erro interno do servidor"

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  })
}

export const notFoundHandler = (
  req: Request,
  res: Response
) => {
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  })
}
