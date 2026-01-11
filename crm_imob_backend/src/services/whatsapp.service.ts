import makeWASocket, {
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket
} from "@whiskeysockets/baileys"
import { config } from "../config/index"
import { Logger, sleep } from "../utils/helpers"
import { WhatsAppChat, WhatsAppMessage, QRCodeData } from "../types/whatsapp"
import fs from "fs"
import path from "path"
// Use CommonJS-style require to avoid TS type issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require("qrcode")

const logger = new Logger("WhatsAppService")

export class WhatsAppService {
  private sock: WASocket | null = null
  private currentQRCode: QRCodeData | null = null
  private isConnected: boolean = false
  private sessionId: string | null = null
  private isInitializing: boolean = false

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  /**
   * Inicializa a conexão com WhatsApp via Baileys
   */
  async initialize(): Promise<{ qrCode: string; expiresAt: number } | { status: string }> {
    try {
      if (!this.sessionId) {
        throw new Error("Session ID is not set")
      }

      // Evita múltiplas inicializações simultâneas
      if (this.isInitializing) {
        logger.log("Inicialização já em andamento para sessão: " + this.sessionId)
        // Se já tem QR code, retorna
        if (this.currentQRCode) {
          return {
            qrCode: this.currentQRCode.qrCode,
            expiresAt: this.currentQRCode.expiresAt
          }
        }
        return { status: "initializing" }
      }

      this.isInitializing = true

      logger.log(`Inicializando WhatsApp (Baileys) para sessão: ${this.sessionId}`)

      // Se já tem QR code gerado, retorna
      if (this.currentQRCode) {
        this.isInitializing = false
        return {
          qrCode: this.currentQRCode.qrCode,
          expiresAt: this.currentQRCode.expiresAt
        }
      }

      // Se já está conectado, retorna status
      if (this.isConnected && this.sock) {
        this.isInitializing = false
        return { status: "connected" }
      }

      // Encerra sessão anterior, se houver
      if (this.sock) {
        await this.disconnect()
      }

      const userDataDir = path.join(config.whatsappDataPath, this.sessionId)
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true })
      }

      // Configura estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(userDataDir)
      const { version } = await fetchLatestBaileysVersion()

      // Cria socket
      this.sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        browser: ["CRM Imob", "Chrome", "120"],
        syncFullHistory: false
      })

      // Sem store por enquanto; endpoints básicos continuarão funcionando

      // Observa atualizações de conexão
      this.sock.ev.on("connection.update", async (update) => {
        const { connection, qr, lastDisconnect } = update

        if (qr) {
          try {
            const dataUrl = await QRCode.toDataURL(qr)
            this.currentQRCode = {
              qrCode: dataUrl,
              expiresAt: Date.now() + config.whatsappQrTimeout
            }
            logger.log("QR Code (Baileys) disponível")
          } catch (err) {
            logger.error("Falha ao gerar DataURL do QR", err)
          }
        }

        if (connection === "open") {
          this.isConnected = true
          this.currentQRCode = null
          logger.log("Conexão WhatsApp aberta")
        } else if (connection === "close") {
          const reason = (lastDisconnect?.error as any)?.output?.statusCode
          logger.log("Conexão encerrada", reason)
          this.isConnected = false
        }
      })

      // Salva credenciais
      this.sock.ev.on("creds.update", saveCreds)

      // Espera QR ou conexão
      logger.log("Aguardando QR ou conexão...")
      const result = await Promise.race([
        this.waitForQRCode(),
        new Promise<{ status: string }>((resolve) =>
          setTimeout(() => resolve({ status: this.isConnected ? "connected" : "initializing" }), 5000)
        )
      ])

      this.isInitializing = false

      if (result && (result as any).qrCode) {
        const qr = result as QRCodeData
        return { qrCode: qr.qrCode, expiresAt: qr.expiresAt }
      }

      return { status: this.isConnected ? "connected" : "initializing" }
    } catch (error) {
      this.isInitializing = false
      logger.error("Erro ao inicializar WhatsApp", error)
      try { await this.disconnect() } catch {}
      throw error
    }
  }

  /**
   * Aguarda QR Code via Baileys
   */
  private async waitForQRCode(): Promise<QRCodeData | null> {
    try {
      // Aguarda até currentQRCode ser populado pelos eventos
      const deadline = Date.now() + 60000
      while (Date.now() < deadline) {
        if (this.currentQRCode) return this.currentQRCode
        if (this.isConnected) return null
        await sleep(300)
      }
      return null
    } catch (error) {
      logger.error("Erro ao aguardar QR Code (Baileys)", error)
      return null
    }
  }

  /**
   * Aguarda a autenticação via QR Code
   */
  async waitForAuthentication(): Promise<boolean> {
    try {
      logger.log("Aguardando autenticação (Baileys)...")
      const deadline = Date.now() + config.whatsappQrTimeout
      while (Date.now() < deadline) {
        if (this.isConnected) return true
        await sleep(400)
      }
      return false
    } catch (error) {
      logger.error("Erro ao autenticar (Baileys)", error)
      return false
    }
  }

  /**
   * Obtém a lista de conversas
   */
  async getChats(): Promise<WhatsAppChat[]> {
    if (!this.sock || !this.isConnected) throw new Error("WhatsApp não está conectado")
    try {
      // TODO: Implementar store para listar conversas
      return []
    } catch (error) {
      logger.error("Erro ao obter conversas (Baileys)", error)
      return []
    }
  }

  /**
   * Obtém as mensagens de uma conversa
   */
  async getMessages(chatId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    if (!this.sock || !this.isConnected) throw new Error("WhatsApp não está conectado")
    try {
      // TODO: Implementar histórico via store
      return []
    } catch (error) {
      logger.error("Erro ao obter mensagens (Baileys)", error)
      return []
    }
  }

  /**
   * Envia uma mensagem para uma conversa
   */
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.sock || !this.isConnected) throw new Error("WhatsApp não está conectado")

    try {
      await this.sock.sendMessage(chatId, { text: message })
      logger.log(`Mensagem enviada para ${chatId}: ${message.substring(0, 50)}...`)
      return true
    } catch (error) {
      logger.error("Erro ao enviar mensagem (Baileys)", error)
      return false
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnectedToWhatsApp(): boolean {
    return this.isConnected
  }

  /**
   * Desconecta do WhatsApp
   */
  async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        try {
          await this.sock.logout()
        } catch {}
        this.sock = null
      }
      this.isConnected = false
      logger.log("Desconectado do WhatsApp (Baileys)")
    } catch (error) {
      logger.error("Erro ao desconectar (Baileys)", error)
      this.sock = null
    }
  }

  /**
   * Obtém o status da conexão
   */
  getStatus(): string {
    if (this.isConnected) return "active"
    return "inactive"
  }
}
