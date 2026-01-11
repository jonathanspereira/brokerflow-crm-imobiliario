import { Router } from "express"
import * as whatsappController from "../controllers/whatsapp.controller"

const router = Router()

/**
 * POST /api/v1/whatsapp/initialize
 * Inicializa conexão com WhatsApp Web
 */
router.post("/initialize", whatsappController.initializeWhatsApp)

/**
 * POST /api/v1/whatsapp/authenticate
 * Aguarda autenticação via QR Code
 */
router.post("/authenticate", whatsappController.waitForAuthentication)

/**
 * GET /api/v1/whatsapp/status
 * Obtém status da conexão
 */
router.get("/status", whatsappController.getStatus)

/**
 * GET /api/v1/whatsapp/chats
 * Obtém lista de conversas
 */
router.get("/chats", whatsappController.getChats)

/**
 * GET /api/v1/whatsapp/messages/:chatId
 * Obtém mensagens de uma conversa
 */
router.get("/messages/:chatId", whatsappController.getMessages)

/**
 * POST /api/v1/whatsapp/send
 * Envia uma mensagem
 */
router.post("/send", whatsappController.sendMessage)

/**
 * POST /api/v1/whatsapp/disconnect
 * Desconecta do WhatsApp
 */
router.post("/disconnect", whatsappController.disconnect)

/**
 * GET /api/v1/whatsapp/sessions
 * Lista sessões ativas
 */
router.get("/sessions", whatsappController.listSessions)

export default router
