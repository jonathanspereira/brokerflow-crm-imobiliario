import { Request, Response } from 'express'
import { PrismaClient, Lead } from '@prisma/client'
import { cache } from '../utils/cache'

const prisma = new PrismaClient()

// Prisma include configuration for N+1 optimization
const leadInclude = {
  imovel: true,
  agencia: true,
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  },
}

// Type for lead with includes
type LeadWithRelations = Lead & {
  imovel?: any
  agencia?: any
  assignedTo?: any
}

// Legacy compatibility: Expose Prisma queries for other modules (e.g., document generation)
export const _leadsMemory = {
  getAll: async () => {
    const leads = await prisma.lead.findMany({
      where: { status: { not: 'finalizado' } },
      include: leadInclude,
      orderBy: { createdAt: 'desc' }
    })
    return leads
  },
  getById: async (id: number | string) => {
    const leadId = typeof id === 'string' ? id : String(id)
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: leadInclude
    })
    return lead
  },
}

export const leadsController = {
  // Get all active leads (excluding finalized)
  async getAll(req: Request, res: Response) {
    try {
      const { agenciaId } = (req as any).user || {}
      
      const cacheKey = `leads:all:${agenciaId || 'global'}`
      const cached = await cache.getJSON<LeadWithRelations[]>(cacheKey)
      if (cached) {
        return res.json({ success: true, data: cached, timestamp: new Date().toISOString(), cached: true })
      }

      // Use Prisma with include to avoid N+1 queries
      const leads = await prisma.lead.findMany({
        where: {
          status: { not: 'finalizado' },
          ...(agenciaId && { agenciaId }),
        },
        include: leadInclude,
        orderBy: { createdAt: 'desc' }
      })

      await cache.setJSON(cacheKey, leads, 60)
      res.json({ success: true, data: leads, timestamp: new Date().toISOString() })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leads',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Get finalized leads
  async getFinalized(req: Request, res: Response) {
    try {
      const { agenciaId } = (req as any).user || {}
      
      const cacheKey = `leads:finalized:${agenciaId || 'global'}`
      const cached = await cache.getJSON<LeadWithRelations[]>(cacheKey)
      if (cached) {
        return res.json({ success: true, data: cached, timestamp: new Date().toISOString(), cached: true })
      }

      // Use Prisma with include to avoid N+1 queries
      const finalizedLeads = await prisma.lead.findMany({
        where: {
          status: 'finalizado',
          ...(agenciaId && { agenciaId }),
        },
        include: leadInclude,
        orderBy: { updatedAt: 'desc' }
      })

      await cache.setJSON(cacheKey, finalizedLeads, 60)
      res.json({ success: true, data: finalizedLeads, timestamp: new Date().toISOString() })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch finalized leads',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Get lead by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}
      
      // Use Prisma with include to avoid N+1 queries
      const lead = await prisma.lead.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        },
        include: leadInclude
      })
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          timestamp: new Date().toISOString()
        })
      }

      res.json({
        success: true,
        data: lead,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lead',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Create new lead
  async create(req: Request, res: Response) {
    try {
      const { name, email, phone, whatsappPhone, cpf, source, notes, imovelId, assignedToId } = req.body
      const { agenciaId, id: userId } = (req as any).user || {}

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name is required',
          timestamp: new Date().toISOString()
        })
      }

      if (!agenciaId) {
        return res.status(400).json({
          success: false,
          error: 'Agency ID is required',
          timestamp: new Date().toISOString()
        })
      }

      // Create lead using Prisma
      const newLead = await prisma.lead.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          whatsappPhone: whatsappPhone || null,
          cpf: cpf || null,
          source: source || 'Site',
          notes: notes || null,
          status: 'new',
          agenciaId,
          imovelId: imovelId || null,
          assignedToId: assignedToId || userId || null,
        },
        include: leadInclude
      })

      await cache.delPrefix('leads:')
      res.status(201).json({
        success: true,
        data: newLead,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      // Handle unique constraint violations (email, cpf)
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field'
        return res.status(409).json({
          success: false,
          error: `A lead with this ${field} already exists`,
          timestamp: new Date().toISOString()
        })
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to create lead',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Update lead
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}
      const updates = req.body

      // Verify lead exists and belongs to agency
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })
      
      if (!existingLead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          timestamp: new Date().toISOString()
        })
      }

      // Update lead using Prisma
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
        include: leadInclude
      })

      await cache.delPrefix('leads:')
      res.json({
        success: true,
        data: updatedLead,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field'
        return res.status(409).json({
          success: false,
          error: `A lead with this ${field} already exists`,
          timestamp: new Date().toISOString()
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update lead',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Delete lead
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}
      
      // Verify lead exists and belongs to agency
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })
      
      if (!existingLead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          timestamp: new Date().toISOString()
        })
      }

      // Delete lead using Prisma
      await prisma.lead.delete({
        where: { id }
      })

      await cache.delPrefix('leads:')
      res.json({
        success: true,
        data: { message: 'Lead deleted successfully' },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete lead',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Move lead to different stage
  async moveToStage(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body
      const { agenciaId } = (req as any).user || {}

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
          timestamp: new Date().toISOString()
        })
      }

      // Verify lead exists and belongs to agency
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })
      
      if (!existingLead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          timestamp: new Date().toISOString()
        })
      }

      // Update status using Prisma
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: leadInclude
      })

      await cache.delPrefix('leads:')
      res.json({
        success: true,
        data: updatedLead,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to move lead',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Add note to lead
  async addNote(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { text } = req.body
      const { agenciaId } = (req as any).user || {}

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Note text is required',
          timestamp: new Date().toISOString()
        })
      }

      // Verify lead exists and belongs to agency
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })
      
      if (!existingLead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          timestamp: new Date().toISOString()
        })
      }

      // Append note to existing notes field
      const currentNotes = existingLead.notes || ''
      const newNote = `[${new Date().toISOString()}] ${text}`
      const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote

      // Update lead with new note
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          notes: updatedNotes,
          updatedAt: new Date(),
        },
        include: leadInclude
      })

      await cache.delPrefix('leads:')
      res.json({
        success: true,
        data: updatedLead,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add note',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Finalize lead (set status to 'finalizado')
  async finalize(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { reason, comment } = req.body
      const { agenciaId } = (req as any).user || {}

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Reason is required',
          timestamp: new Date().toISOString()
        })
      }

      // Verify lead exists and belongs to agency
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })
      
      if (!existingLead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          timestamp: new Date().toISOString()
        })
      }

      // Store finalization info in notes and update status
      const finalizationNote = `[FINALIZADO ${new Date().toISOString()}] Motivo: ${reason}${comment ? ` - ${comment}` : ''}`
      const currentNotes = existingLead.notes || ''
      const updatedNotes = currentNotes ? `${currentNotes}\n${finalizationNote}` : finalizationNote

      const finalizedLead = await prisma.lead.update({
        where: { id },
        data: {
          status: 'finalizado',
          notes: updatedNotes,
          updatedAt: new Date(),
        },
        include: leadInclude
      })

      await cache.delPrefix('leads:')
      res.json({
        success: true,
        data: finalizedLead,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to finalize lead',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Reopen finalized lead
  async reopen(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}
      
      // Verify lead exists, is finalized, and belongs to agency
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          status: 'finalizado',
          ...(agenciaId && { agenciaId }),
        }
      })
      
      if (!existingLead) {
        return res.status(404).json({
          success: false,
          error: 'Finalized lead not found',
          timestamp: new Date().toISOString()
        })
      }

      // Reopen lead by setting status back to 'new'
      const reopenNote = `[REABERTO ${new Date().toISOString()}]`
      const currentNotes = existingLead.notes || ''
      const updatedNotes = currentNotes ? `${currentNotes}\n${reopenNote}` : reopenNote

      const reopenedLead = await prisma.lead.update({
        where: { id },
        data: {
          status: 'new',
          notes: updatedNotes,
          updatedAt: new Date(),
        },
        include: leadInclude
      })

      await cache.delPrefix('leads:')
      res.json({
        success: true,
        data: reopenedLead,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to reopen lead',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Bulk import leads using Prisma
  async createBulkLeads(req: Request, res: Response) {
    try {
      const incoming = Array.isArray(req.body?.leads) ? req.body.leads : []

      if (!incoming.length) {
        return res.status(400).json({ success: false, error: 'Leads array is required', timestamp: new Date().toISOString() })
      }

      const sanitized = incoming
        .map((lead: any) => ({
          name: typeof lead.name === 'string' ? lead.name.trim() : '',
          phone: typeof lead.phone === 'string' ? lead.phone.replace(/\D+/g, '') : '',
          email: typeof lead.email === 'string' ? lead.email.trim() : null,
          interest: typeof lead.interest === 'string' ? lead.interest.trim() : null,
        }))
        .filter((l: { name: string; phone: string; email: string | null; interest: string | null }) => l.name && l.phone)

      if (!sanitized.length) {
        return res.status(400).json({ success: false, error: 'Each lead must have name and phone', timestamp: new Date().toISOString() })
      }

      const agenciaId = (req as any).user?.agenciaId
      const corretorId = (req as any).user?.id

      const data = sanitized.map((l: { name: string; phone: string; email: string | null; interest: string | null }) => ({
        ...l,
        agenciaId,
        corretorId,
      }))

      const result = await prisma.lead.createMany({
        data,
        skipDuplicates: true,
      })

      return res.status(201).json({ success: true, imported: result.count, timestamp: new Date().toISOString() })
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to import leads', timestamp: new Date().toISOString() })
    }
  }
}
