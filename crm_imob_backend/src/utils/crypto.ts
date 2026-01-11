import crypto from "crypto"
import { config } from "../config/index"

// Gera Buffer de chave a partir de hex configurado
function getKey(): Buffer {
  const hex = config.encryptionKey
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("ENCRYPTION_KEY deve ser hex de 32 bytes (64 chars)")
  }
  return Buffer.from(hex, "hex")
}

// Hash determinístico com HMAC-SHA256 (para unicidade/busca)
export function hashDeterministic(value: string): string {
  const hmac = crypto.createHmac("sha256", getKey())
  hmac.update(value)
  return hmac.digest("hex")
}

// Criptografia simétrica AES-256-GCM
export function encryptString(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12) // GCM IV 96-bit
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}.${encrypted.toString("base64")}.${tag.toString("base64")}`
}

export function decryptString(token: string): string {
  const [ivB64, dataB64, tagB64] = token.split(".")
  if (!ivB64 || !dataB64 || !tagB64) throw new Error("Token de criptografia inválido")
  const key = getKey()
  const iv = Buffer.from(ivB64, "base64")
  const data = Buffer.from(dataB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString("utf8")
}
