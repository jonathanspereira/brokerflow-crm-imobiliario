import app from "./app"
import { config } from "./config/index"
import { Logger } from "./utils/helpers"
import { initTelemetry, shutdownTelemetry } from "./telemetry"

const logger = new Logger("Server")

const PORT = config.port

// OpenTelemetry (opcional)
const telemetry = initTelemetry()

const server = app.listen(PORT, () => {
  logger.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
  logger.log(`📁 Ambiente: ${config.nodeEnv}`)
  logger.log(`🔗 CORS Origin: ${config.corsOrigin}`)
  logger.log(`🗂️  WhatsApp Data Path: ${config.whatsappDataPath}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.log("SIGTERM recebido, encerrando servidor...")
  server.close(async () => {
    await shutdownTelemetry()
    logger.log("Servidor encerrado")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  logger.log("SIGINT recebido, encerrando servidor...")
  server.close(async () => {
    await shutdownTelemetry()
    logger.log("Servidor encerrado")
    process.exit(0)
  })
})

// Tratamento de erros não capturados
process.on("uncaughtException", (error) => {
  logger.error("Erro não capturado", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promise rejeitada não tratada", reason)
})

export default server
