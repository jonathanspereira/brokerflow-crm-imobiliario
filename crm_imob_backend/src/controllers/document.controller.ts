import { Request, Response } from "express"
import { prisma } from "../prisma"
import { _leadsMemory } from "./leads.controller"
import { _inventoryMemory } from "./inventory.controller"
import Handlebars from "handlebars"
import { Logger } from "../utils/helpers"

const logger = new Logger("DocumentController")

function formatCurrencyBRL(value: number | string | null | undefined) {
  const numeric = Number(value || 0)
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric)
}

function formatDateBR() {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, "0")
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const yyyy = now.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export const documentController = {
  async getModels(req: Request, res: Response) {
    try {
      const models = await prisma.documentModel.findMany({
        select: {
          id: true,
          name: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      })

      return res.json({
        success: true,
        data: models,
      })
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar modelos" })
    }
  },

  async createModel(req: Request, res: Response) {
    try {
      const { name, content } = req.body

      if (!name || !content) {
        return res.status(400).json({ error: "Nome e conteúdo do modelo são obrigatórios" })
      }

      const model = await prisma.documentModel.create({
        data: {
          name,
          content,
        },
      })

      return res.status(201).json({
        success: true,
        data: model,
      })
    } catch (error) {
      return res.status(500).json({ error: "Erro ao criar modelo" })
    }
  },

  async updateModel(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { name, content } = req.body

      if (!name || !content) {
        return res.status(400).json({ error: "Nome e conteúdo do modelo são obrigatórios" })
      }

      const model = await prisma.documentModel.update({
        where: { id },
        data: {
          name,
          content,
        },
      })

      return res.json({
        success: true,
        data: model,
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Modelo não encontrado" })
      }
      return res.status(500).json({ error: "Erro ao atualizar modelo" })
    }
  },

  async deleteModel(req: Request, res: Response) {
    try {
      const { id } = req.params

      await prisma.documentModel.delete({
        where: { id },
      })

      return res.json({
        success: true,
        message: "Modelo deletado com sucesso",
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Modelo não encontrado" })
      }
      return res.status(500).json({ error: "Erro ao deletar modelo" })
    }
  },

  async prepareDraft(req: Request, res: Response) {
    try {
      const { modelId, leadId, imovelId, proposalValue } = req.body || {}

      if (!modelId || !leadId || !imovelId) {
        return res.status(400).json({ error: "modelId, leadId e imovelId são obrigatórios" })
      }

      const brokerId = (req as any).user?.id as string | undefined

      // Always coerce to string for Prisma lookups
      const leadIdStr = String(leadId)
      const imovelIdStr = String(imovelId)

      const [model, leadDb, imovelDb, broker] = await Promise.all([
        prisma.documentModel.findUnique({ where: { id: String(modelId) } }),
        prisma.lead.findUnique({ where: { id: leadIdStr } }),
        prisma.imovel.findUnique({ where: { id: imovelIdStr } }),
        brokerId ? prisma.user.findUnique({ where: { id: brokerId } }) : null,
      ])

      // Fallback to in-memory data if Prisma is empty (async calls)
      const lead = leadDb || await _leadsMemory.getById(leadId)
      const imovel = imovelDb || await _inventoryMemory.getById(imovelId)

      if (!model) return res.status(404).json({ error: "Modelo de documento não encontrado" })
      if (!lead) return res.status(404).json({ error: "Lead não encontrado" })
      if (!imovel) return res.status(404).json({ error: "Imóvel não encontrado" })

      const context = {
        // Nomes simples (compatibilidade)
        client_name: lead.name || "",
        client_cpf: (lead as any).cpf || "",
        property_title: (imovel as any).title || (imovel as any).nome || "",
        property_address: (imovel as any).address || (imovel as any).endereco || "",
        proposal_value: formatCurrencyBRL(proposalValue),
        current_date: formatDateBR(),
        broker_name: broker?.name || "",
        
        // Nomes aninhados (compatibilidade com templates existentes)
        lead: {
          id: lead.id,
          name: lead.name || "",
          nome: lead.name || "",
          email: (lead as any).email || "",
          phone: (lead as any).phone || "",
          telefone: (lead as any).phone || "",
          cpf: (lead as any).cpf || "",
        },
        imovel: {
          id: imovel.id,
          title: (imovel as any).title || (imovel as any).nome || "",
          nome: (imovel as any).title || (imovel as any).nome || "",
          address: (imovel as any).address || (imovel as any).endereco || "",
          endereco: (imovel as any).address || (imovel as any).endereco || "",
          valor: formatCurrencyBRL(proposalValue),
          value: formatCurrencyBRL(proposalValue),
          price: formatCurrencyBRL(proposalValue),
        },
        broker: {
          name: broker?.name || "",
          email: broker?.email || "",
        },
      }

      logger.debug("Context para substituição de placeholders", context)
      logger.debug("Template content", { length: model.content?.length })

      const template = Handlebars.compile(model.content || "")
      const html = template(context)

      logger.debug("HTML gerado", { length: html.length })

      return res.json({ html, context })
    } catch (error: any) {
      console.error("Erro ao preparar minuta:", error)
      return res.status(500).json({ error: error?.message || "Erro ao preparar minuta" })
    }
  },

  async saveToHistory(req: Request, res: Response) {
    try {
      const { leadId, imovelId, modelId, modelName, content, proposalValue } = req.body

      if (!leadId || !modelId || !content) {
        return res.status(400).json({ error: "leadId, modelId e content são obrigatórios" })
      }

      const userId = (req as any).user?.id

      const document = await prisma.documentHistory.create({
        data: {
          leadId: String(leadId),
          imovelId: imovelId ? String(imovelId) : null,
          modelId: String(modelId),
          modelName: modelName || "Sem nome",
          content,
          proposalValue: proposalValue ? Number(proposalValue) : null,
          createdById: userId,
        },
      })

      return res.status(201).json({
        success: true,
        data: document,
      })
    } catch (error: any) {
      console.error("Erro ao salvar documento no histórico:", error)
      return res.status(500).json({ error: error?.message || "Erro ao salvar documento" })
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const { leadId } = req.params

      const documents = await prisma.documentHistory.findMany({
        where: {
          leadId: String(leadId),
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          modelName: true,
          content: true,
          proposalValue: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.json({
        success: true,
        data: documents,
      })
    } catch (error: any) {
      console.error("Erro ao buscar histórico de documentos:", error)
      return res.status(500).json({ error: error?.message || "Erro ao buscar histórico" })
    }
  },

  async getDocumentById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const document = await prisma.documentHistory.findUnique({
        where: { id },
        select: {
          id: true,
          leadId: true,
          modelName: true,
          content: true,
          proposalValue: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" })
      }

      return res.json({
        success: true,
        data: document,
      })
    } catch (error: any) {
      console.error("Erro ao buscar documento:", error)
      return res.status(500).json({ error: error?.message || "Erro ao buscar documento" })
    }
  },

  async updateDocument(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { content } = req.body

      if (!content) {
        return res.status(400).json({ error: "content é obrigatório" })
      }

      const document = await prisma.documentHistory.update({
        where: { id },
        data: {
          content,
          updatedAt: new Date(),
        },
      })

      return res.json({
        success: true,
        data: document,
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Documento não encontrado" })
      }
      console.error("Erro ao atualizar documento:", error)
      return res.status(500).json({ error: error?.message || "Erro ao atualizar documento" })
    }
  },
}
