import { PrismaClient } from "@prisma/client"
import { encryptString, hashDeterministic } from "./utils/crypto"

const prisma = new PrismaClient()

// Middleware para criptografar CPF em Leads
prisma.$use(async (params, next) => {
  if (params.model === "Lead" && (params.action === "create" || params.action === "update" || params.action === "upsert")) {
    const data = params.args?.data
    if (data && typeof data.cpf === "string" && data.cpf.trim().length > 0) {
      const cpfPlain = data.cpf.trim()
      params.args.data = {
        ...data,
        cpf: hashDeterministic(cpfPlain),
        cpfEnc: encryptString(cpfPlain),
      }
    }
  }
  return next(params)
})

export { prisma }
