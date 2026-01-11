import { Request, Response } from 'express'
import { PrismaClient, Imovel } from '@prisma/client'
import { cache } from '../utils/cache'

const prisma = new PrismaClient()

// Prisma include configuration for N+1 optimization
const imovelInclude = {
  agencia: {
    select: {
      id: true,
      name: true,
    }
  },
  leads: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
    }
  },
}

// Type for imovel with includes
type ImovelWithRelations = Imovel & {
  agencia?: any
  leads?: any[]
}

// Legacy compatibility interface
export interface Property {
  id: string
  project: string
  address: string
  unit: string
  price: number
  status: 'Pre-lancamento' | 'Disponivel' | 'Vendido'
  books?: string[]
}

// Legacy compatibility: Expose Prisma queries for other modules (e.g., document generation)
export const _inventoryMemory = {
  getAll: async () => {
    const imoveis = await prisma.imovel.findMany({
      include: imovelInclude,
      orderBy: { createdAt: 'desc' }
    })
    return imoveis
  },
  getById: async (id: number | string) => {
    const imovelId = typeof id === 'string' ? id : String(id)
    const imovel = await prisma.imovel.findUnique({
      where: { id: imovelId },
      include: imovelInclude
    })
    return imovel
  },
}

export const inventoryController = {
  // Get all properties
  async getAll(req: Request, res: Response) {
    try {
      const { agenciaId } = (req as any).user || {}
      const { status } = req.query
      
      const cacheKey = `inventory:all:${agenciaId || 'global'}:${status || 'all'}`
      const cached = await cache.getJSON<ImovelWithRelations[]>(cacheKey)
      if (cached) {
        return res.json({ success: true, data: cached, timestamp: new Date().toISOString(), cached: true })
      }

      // Use Prisma with include to avoid N+1 queries
      const imoveis = await prisma.imovel.findMany({
        where: {
          ...(agenciaId && { agenciaId }),
          ...(status && status !== 'all' && { status: status as string }),
        },
        include: imovelInclude,
        orderBy: { createdAt: 'desc' }
      })

      await cache.setJSON(cacheKey, imoveis, 60)
      res.json({
        success: true,
        data: imoveis,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch properties',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Get available properties only
  async getAvailable(req: Request, res: Response) {
    try {
      const { agenciaId } = (req as any).user || {}
      
      const cacheKey = `inventory:available:${agenciaId || 'global'}`
      const cached = await cache.getJSON<ImovelWithRelations[]>(cacheKey)
      if (cached) {
        return res.json({ success: true, data: cached, timestamp: new Date().toISOString(), cached: true })
      }

      // Use Prisma with include to avoid N+1 queries
      const available = await prisma.imovel.findMany({
        where: {
          status: 'Disponivel',
          ...(agenciaId && { agenciaId }),
        },
        include: imovelInclude,
        orderBy: { createdAt: 'desc' }
      })

      await cache.setJSON(cacheKey, available, 60)
      res.json({
        success: true,
        data: available,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available properties',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Get property by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}

      // Use Prisma with include to avoid N+1 queries
      const property = await prisma.imovel.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        },
        include: imovelInclude
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
          timestamp: new Date().toISOString()
        })
      }

      res.json({
        success: true,
        data: property,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch property',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Create new property
  async create(req: Request, res: Response) {
    try {
      const { agenciaId } = (req as any).user || {}
      const { codigo, title, address, projeto, status, valor } = req.body

      if (!codigo || !agenciaId) {
        return res.status(400).json({
          success: false,
          error: 'codigo and agenciaId are required',
          timestamp: new Date().toISOString()
        })
      }

      // Create property using Prisma
      const newProperty = await prisma.imovel.create({
        data: {
          agenciaId,
          codigo,
          title: title || null,
          address: address || null,
          projeto: projeto || null,
          status: status || 'Disponivel',
          valor: valor ? Number(valor) : null,
        },
        include: imovelInclude
      })

      await cache.delPrefix('inventory:')
      res.status(201).json({
        success: true,
        data: newProperty,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      // Handle unique constraint violation (agenciaId + codigo)
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'A property with this codigo already exists in this agency',
          timestamp: new Date().toISOString()
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create property',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Update property
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}
      const updates = req.body

      // Verify property exists and belongs to agency
      const existingProperty = await prisma.imovel.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })

      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
          timestamp: new Date().toISOString()
        })
      }

      // Update property using Prisma
      const updatedProperty = await prisma.imovel.update({
        where: { id },
        data: {
          ...updates,
          ...(updates.valor && { valor: Number(updates.valor) }),
          updatedAt: new Date(),
        },
        include: imovelInclude
      })

      await cache.delPrefix('inventory:')
      res.json({
        success: true,
        data: updatedProperty,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'A property with this codigo already exists in this agency',
          timestamp: new Date().toISOString()
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update property',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Delete property
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}

      // Verify property exists and belongs to agency
      const existingProperty = await prisma.imovel.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })

      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
          timestamp: new Date().toISOString()
        })
      }

      // Delete property using Prisma
      await prisma.imovel.delete({
        where: { id }
      })

      await cache.delPrefix('inventory:')
      res.json({
        success: true,
        message: 'Property deleted',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete property',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Get properties by project
  async getByProject(req: Request, res: Response) {
    try {
      const { project } = req.params
      const { agenciaId } = (req as any).user || {}
      
      const cacheKey = `inventory:project:${agenciaId || 'global'}:${project}`
      const cached = await cache.getJSON<ImovelWithRelations[]>(cacheKey)
      if (cached) {
        return res.json({ success: true, data: cached, timestamp: new Date().toISOString(), cached: true })
      }

      // Use Prisma with include to avoid N+1 queries
      const projectProperties = await prisma.imovel.findMany({
        where: {
          projeto: {
            equals: project,
            mode: 'insensitive', // Case-insensitive search
          },
          ...(agenciaId && { agenciaId }),
        },
        include: imovelInclude,
        orderBy: { createdAt: 'desc' }
      })

      await cache.setJSON(cacheKey, projectProperties, 60)
      res.json({
        success: true,
        data: projectProperties,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch properties by project',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Format property for display
  async formatPropertyName(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { agenciaId } = (req as any).user || {}

      // Use Prisma to fetch property
      const property = await prisma.imovel.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
          timestamp: new Date().toISOString()
        })
      }

      const formatted = `${property.projeto || 'N/A'} - ${property.codigo}`

      res.json({
        success: true,
        data: { id: property.id, name: formatted, price: property.valor },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to format property name',
        timestamp: new Date().toISOString()
      })
    }
  },

  // Get book/document from property
  async getBook(req: Request, res: Response) {
    try {
      const { id, bookName } = req.params
      const { agenciaId } = (req as any).user || {}

      // Use Prisma to fetch property
      const property = await prisma.imovel.findFirst({
        where: {
          id,
          ...(agenciaId && { agenciaId }),
        }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          error: `Rota não encontrada: GET /api/v1/inventory/${id}/books/${bookName}`,
          timestamp: new Date().toISOString()
        })
      }

      // For now, return book metadata
      // In future, could store books array in property JSON field
      res.json({
        success: true,
        data: {
          id: property.id,
          name: property.address || property.projeto,
          book: decodeURIComponent(bookName)
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch book',
        timestamp: new Date().toISOString()
      })
    }
  }
}
