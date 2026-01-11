import { Request, Response, NextFunction } from "express"
import { Role } from "@prisma/client"
import { prisma } from "../prisma"


/**
 * Hierarquia de permissões:
 * SUPER_ADMIN > ADMIN/AUTONOMO > GESTOR > CORRETOR
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  AUTONOMO: 80,
  GESTOR: 60,
  CORRETOR: 40
}

/**
 * Middleware RBAC com lógica hierárquica
 * @param allowedRoles - Array de roles permitidas
 */
type CheckRoleOptions = { hierarchical?: boolean }

export const checkRole = (allowedRoles: Role[] | Role, options: CheckRoleOptions = { hierarchical: false }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore
      const user = req.user

      if (!user || !user.role) {
        return res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
          timestamp: new Date().toISOString()
        })
      }

      const userRole = user.role as Role

      // SUPER_ADMIN tem acesso total
      if (userRole === "SUPER_ADMIN") {
        return next()
      }

      const allowedList: Role[] = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

      // Verifica se o role do usuário está na lista de permitidos
      const isAllowed = options.hierarchical
        ? allowedList.some(role => {
            const userLevel = ROLE_HIERARCHY[userRole] || 0
            const requiredLevel = ROLE_HIERARCHY[role] || 0
            return userLevel >= requiredLevel
          })
        : allowedList.includes(userRole)

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          error: "Permissão negada. Você não tem acesso a este recurso.",
          code: "INSUFFICIENT_PERMISSIONS",
          timestamp: new Date().toISOString()
        })
      }

      next()
    } catch (error) {
      console.error("[CheckRole] Erro:", error)
      return res.status(500).json({
        success: false,
        error: "Erro ao verificar permissões",
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * Verifica se o usuário pode acessar dados de um recurso específico
 * Aplicando a lógica:
 * - SUPER_ADMIN: acesso total
 * - ADMIN/AUTONOMO: acesso total dentro da sua agência
 * - GESTOR: acesso aos dados da sua equipe
 * - CORRETOR: acesso apenas aos seus próprios dados
 */
export const checkResourceAccess = async (
  userId: string,
  resourceOwnerId: string,
  agenciaId: string
): Promise<{ hasAccess: boolean; reason?: string }> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        agenciaId: true,
        equipeId: true
      }
    })

    if (!user) {
      return { hasAccess: false, reason: "Usuário não encontrado" }
    }

    // SUPER_ADMIN tem acesso total
    if (user.role === "SUPER_ADMIN") {
      return { hasAccess: true }
    }

    // Verifica se o usuário pertence à mesma agência
    if (user.agenciaId !== agenciaId) {
      return { hasAccess: false, reason: "Recurso de outra agência" }
    }

    // ADMIN e AUTONOMO têm acesso total dentro da agência
    if (user.role === "ADMIN" || user.role === "AUTONOMO") {
      return { hasAccess: true }
    }

    // GESTOR pode acessar dados dos membros da sua equipe
    if (user.role === "GESTOR" && user.equipeId) {
      const resourceOwner = await prisma.user.findUnique({
        where: { id: resourceOwnerId },
        select: { equipeId: true }
      })

      if (resourceOwner && resourceOwner.equipeId === user.equipeId) {
        return { hasAccess: true }
      }

      return { hasAccess: false, reason: "Recurso fora da sua equipe" }
    }

    // CORRETOR só acessa seus próprios dados
    if (user.role === "CORRETOR") {
      if (userId === resourceOwnerId) {
        return { hasAccess: true }
      }
      return { hasAccess: false, reason: "Você só pode acessar seus próprios dados" }
    }

    return { hasAccess: false, reason: "Permissão não definida" }
  } catch (error) {
    console.error("[CheckResourceAccess] Erro:", error)
    return { hasAccess: false, reason: "Erro ao verificar acesso" }
  }
}

/**
 * Middleware para verificar acesso a um recurso específico
 * Use este middleware em rotas que manipulam recursos individuais
 */
export const enforceResourceAccess = (resourceOwnerIdParam: string = "userId") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore
      const currentUser = req.user
      const resourceOwnerId = req.params[resourceOwnerIdParam] || req.body[resourceOwnerIdParam]

      if (!resourceOwnerId) {
        return res.status(400).json({
          success: false,
          error: "ID do recurso não fornecido",
          timestamp: new Date().toISOString()
        })
      }

      const { hasAccess, reason } = await checkResourceAccess(
        currentUser.id,
        resourceOwnerId,
        currentUser.agenciaId
      )

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: reason || "Acesso negado",
          code: "RESOURCE_ACCESS_DENIED",
          timestamp: new Date().toISOString()
        })
      }

      next()
    } catch (error) {
      console.error("[EnforceResourceAccess] Erro:", error)
      return res.status(500).json({
        success: false,
        error: "Erro ao verificar acesso ao recurso",
        timestamp: new Date().toISOString()
      })
    }
  }
}
