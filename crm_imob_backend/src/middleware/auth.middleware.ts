import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config/index"
import { Logger } from "../utils/helpers"

const logger = new Logger("AuthMiddleware")

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role?: string
  }
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"]
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token não fornecido",
    })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded as any
    next()
  } catch (error) {
    logger.error("Erro ao verificar token:", error)
    return res.status(403).json({
      success: false,
      message: "Token inválido ou expirado",
    })
  }
}
