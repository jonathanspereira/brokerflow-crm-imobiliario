import { v4 as uuidv4 } from "uuid"

interface LogContext {
  [key: string]: any
}

export class Logger {
  private prefix: string
  private isDevelopment: boolean

  constructor(name: string) {
    this.prefix = `[${name}]`
    this.isDevelopment = process.env.NODE_ENV === "development"
  }

  /**
   * Structured logging - outputs JSON in production, readable format in development
   */
  private formatLog(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    
    if (this.isDevelopment) {
      // Development: readable format
      let output = `${this.prefix} [${level}] ${message}`
      if (context && Object.keys(context).length > 0) {
        output += ` ${JSON.stringify(context)}`
      }
      return output
    }
    
    // Production: structured JSON logging
    return JSON.stringify({
      timestamp,
      level,
      prefix: this.prefix,
      message,
      ...(context && Object.keys(context).length > 0 && { context }),
    })
  }

  log(message: string, data?: any) {
    const output = this.formatLog("INFO", message, data)
    console.log(output)
  }

  error(message: string, error?: any) {
    const context = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : error
    const output = this.formatLog("ERROR", message, context)
    console.error(output)
  }

  warn(message: string, data?: any) {
    const output = this.formatLog("WARN", message, data)
    console.warn(output)
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      const output = this.formatLog("DEBUG", message, data)
      console.debug(output)
    }
  }
}

export const generateId = (): string => uuidv4()

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("55")) {
    return digits
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }
  return phone
}

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, "")
}
