import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { config } from './config'
import { Logger } from './utils/helpers'

const logger = new Logger('Telemetry')

let sdk: NodeSDK | null = null

export function initTelemetry() {
  if (!config.otelEnabled) {
    return null
  }

  const exporter = new OTLPTraceExporter({ url: config.otelEndpoint })

  sdk = new NodeSDK({
    traceExporter: exporter,
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.otelServiceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.nodeEnv,
    }),
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  })

  // Start SDK (não retorna promise, usa try/catch)
  try {
    sdk.start()
    logger.log('OpenTelemetry iniciado')
  } catch (err: unknown) {
    logger.error('Falha ao iniciar OpenTelemetry', err)
  }

  return sdk
}

export async function shutdownTelemetry() {
  if (sdk) {
    await sdk.shutdown()
    logger.log('OpenTelemetry finalizado')
  }
}
