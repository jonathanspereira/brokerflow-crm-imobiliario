import { WhatsAppService } from "./whatsapp.service"
import { Logger, generateId } from "../utils/helpers"

const logger = new Logger("WhatsAppManager")

interface WhatsAppSession {
  sessionId: string
  service: WhatsAppService
  createdAt: Date
  lastActivity: Date
}

export class WhatsAppManager {
  private static instance: WhatsAppManager
  private sessions: Map<string, WhatsAppSession> = new Map()
  private defaultSessionId = "default"

  private constructor() {
    logger.log("WhatsAppManager inicializado")
  }

  static getInstance(): WhatsAppManager {
    if (!WhatsAppManager.instance) {
      WhatsAppManager.instance = new WhatsAppManager()
    }
    return WhatsAppManager.instance
  }

  /**
   * Obtém ou cria uma sessão
   */
  getOrCreateSession(sessionId: string = this.defaultSessionId): WhatsAppService {
    if (!this.sessions.has(sessionId)) {
      logger.log(`Criando nova sessão: ${sessionId}`)
      const service = new WhatsAppService(sessionId)
      this.sessions.set(sessionId, {
        sessionId,
        service,
        createdAt: new Date(),
        lastActivity: new Date()
      })
    } else {
      // Atualiza última atividade
      const session = this.sessions.get(sessionId)!
      session.lastActivity = new Date()
    }

    return this.sessions.get(sessionId)!.service
  }

  /**
   * Obtém uma sessão sem criar
   */
  getSession(sessionId: string = this.defaultSessionId): WhatsAppService | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    session.lastActivity = new Date()
    return session.service
  }

  /**
   * Obtém a sessão padrão
   */
  getDefaultSession(): WhatsAppService {
    return this.getOrCreateSession()
  }

  /**
   * Encerra uma sessão
   */
  async closeSession(sessionId: string = this.defaultSessionId): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      await session.service.disconnect()
      this.sessions.delete(sessionId)
      logger.log(`Sessão encerrada: ${sessionId}`)
    }
  }

  /**
   * Encerra todas as sessões
   */
  async closeAllSessions(): Promise<void> {
    for (const [sessionId, session] of this.sessions) {
      await session.service.disconnect()
    }
    this.sessions.clear()
    logger.log("Todas as sessões foram encerradas")
  }

  /**
   * Lista todas as sessões ativas
   */
  listSessions(): Array<{ sessionId: string; status: string; createdAt: Date }> {
    return Array.from(this.sessions.values()).map((session) => ({
      sessionId: session.sessionId,
      status: session.service.getStatus(),
      createdAt: session.createdAt
    }))
  }
}
