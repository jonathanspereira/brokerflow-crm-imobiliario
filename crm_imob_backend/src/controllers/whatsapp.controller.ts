import { Request, Response } from "express"
import { WhatsAppManager } from "../services/whatsapp-manager"
import { Logger } from "../utils/helpers"
import { ApiResponse } from "../types/api"

const logger = new Logger("WhatsAppController")
const manager = WhatsAppManager.getInstance()

/**
 * Inicializa conexão com WhatsApp Web
 */
export const initializeWhatsApp = async (req: Request, res: Response) => {
  try {
    const sessionId = req.body.sessionId || "default"
    const service = manager.getOrCreateSession(sessionId)

    const result = await service.initialize()

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao inicializar WhatsApp", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao inicializar WhatsApp",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}

/**
 * Aguarda autenticação via QR Code
 */
export const waitForAuthentication = async (req: Request, res: Response) => {
  try {
    const sessionId = req.body.sessionId || "default"
    const service = manager.getOrCreateSession(sessionId)

    const authenticated = await service.waitForAuthentication()

    const response: ApiResponse = {
      success: authenticated,
      data: { authenticated },
      message: authenticated ? "Autenticado com sucesso" : "Falha na autenticação",
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao aguardar autenticação", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao aguardar autenticação",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}

/**
 * Obtém status da conexão
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string || "default"
    const service = manager.getSession(sessionId)
    const status = service ? service.getStatus() : "disconnected"

    const response: ApiResponse = {
      success: true,
      data: { status },
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao obter status", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao obter status",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}

/**
 * Obtém lista de conversas
 */
export const getChats = async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string || "default"
    const service = manager.getSession(sessionId)

    if (!service) {
      const response: ApiResponse = {
        success: true,
        data: { chats: [] },
        timestamp: new Date().toISOString()
      }
      return res.json(response)
    }

    const chats = await service.getChats()

    const response: ApiResponse = {
      success: true,
      data: { chats },
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao obter conversas", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao obter conversas",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}

/**
 * Obtém mensagens de uma conversa
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string || "default"
    const { chatId } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    const service = manager.getSession(sessionId)
    if (!service) {
      const response: ApiResponse = {
        success: true,
        data: { messages: [] },
        timestamp: new Date().toISOString()
      }
      return res.json(response)
    }
    const messages = await service.getMessages(chatId, limit)

    const response: ApiResponse = {
      success: true,
      data: { messages },
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao obter mensagens", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao obter mensagens",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}

/**
 * Envia uma mensagem
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const sessionId = req.body.sessionId || "default"
    const { chatId } = req.body
    const message: string = req.body.message || req.body.content

    if (!chatId || !message) {
      const response: ApiResponse = {
        success: false,
        error: "chatId e message são obrigatórios",
        timestamp: new Date().toISOString()
      }
      return res.status(400).json(response)
    }

    const service = manager.getOrCreateSession(sessionId)
    const sent = await service.sendMessage(chatId, message)

    const response: ApiResponse = {
      success: sent,
      data: { sent, messageId: `msg_${Date.now()}` },
      message: sent ? "Mensagem enviada com sucesso" : "Erro ao enviar mensagem",
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao enviar mensagem", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao enviar mensagem",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}

/**
 * Desconecta do WhatsApp
 */
export const disconnect = async (req: Request, res: Response) => {
  try {
    const sessionId = req.body.sessionId || "default"
    await manager.closeSession(sessionId)

    const response: ApiResponse = {
      success: true,
      data: { status: "disconnected" },
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao desconectar", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao desconectar",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}

/**
 * Lista sessões ativas
 */
export const listSessions = async (req: Request, res: Response) => {
  try {
    const sessions = manager.listSessions()

    const response: ApiResponse = {
      success: true,
      data: { sessions },
      timestamp: new Date().toISOString()
    }

    return res.json(response)
  } catch (error) {
    logger.error("Erro ao listar sessões", error)
    const response: ApiResponse = {
      success: false,
      error: "Erro ao listar sessões",
      timestamp: new Date().toISOString()
    }
    return res.status(500).json(response)
  }
}
