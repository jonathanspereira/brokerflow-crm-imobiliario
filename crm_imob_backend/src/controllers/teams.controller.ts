import { Request, Response, NextFunction } from "express"
import { Role } from "@prisma/client"
import { prisma } from "../prisma"


export class TeamsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const user = req.user
      const teams = await prisma.equipe.findMany({
        where: { agenciaId: user.agenciaId },
        include: {
          membros: {
            select: { id: true, name: true, role: true }
          },
          gestor: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      res.json({ success: true, data: teams })
    } catch (e) { next(e) }
  }

  static async listManagers(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const user = req.user
      const gestores = await prisma.user.findMany({
        where: { agenciaId: user.agenciaId, role: { in: [Role.GESTOR, Role.ADMIN] } },
        select: { id: true, name: true, email: true, role: true }
      })
      res.json({ success: true, data: gestores })
    } catch (e) { next(e) }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const user = req.user
      const { name } = req.body
      if (!name?.trim()) return res.status(400).json({ success: false, error: 'Nome é obrigatório' })

      const team = await prisma.equipe.create({ data: { name: name.trim(), agenciaId: user.agenciaId } })
      res.status(201).json({ success: true, data: team })
    } catch (e) { next(e) }
  }

  static async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const user = req.user
      const { teamId } = req.params
      const { userId, role } = req.body as { userId: string, role?: Role }

      const team = await prisma.equipe.findFirst({ where: { id: teamId, agenciaId: user.agenciaId } })
      if (!team) return res.status(404).json({ success: false, error: 'Equipe não encontrada' })

      const member = await prisma.user.findFirst({ where: { id: userId, agenciaId: user.agenciaId } })
      if (!member) return res.status(404).json({ success: false, error: 'Usuário não encontrado na agência' })

      await prisma.user.update({ where: { id: userId }, data: { equipeId: team.id, role: role ?? member.role } })
      res.json({ success: true, message: 'Membro adicionado à equipe' })
    } catch (e) { next(e) }
  }

  static async setManager(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const user = req.user
      const { teamId } = req.params
      const { gestorId } = req.body as { gestorId: string }

      const team = await prisma.equipe.findFirst({ where: { id: teamId, agenciaId: user.agenciaId } })
      if (!team) return res.status(404).json({ success: false, error: 'Equipe não encontrada' })

      const gestor = await prisma.user.findFirst({ where: { id: gestorId, agenciaId: user.agenciaId } })
      if (!gestor) return res.status(404).json({ success: false, error: 'Gestor não pertence à agência' })

      await prisma.$transaction([
        prisma.equipe.update({ where: { id: team.id }, data: { gestorId: gestor.id } }),
        prisma.user.update({
          where: { id: gestor.id },
          data: {
            equipeId: team.id,
            role: gestor.role === Role.ADMIN ? Role.ADMIN : Role.GESTOR
          }
        })
      ])

      res.json({ success: true, message: 'Gestor definido com sucesso' })
    } catch (e) { next(e) }
  }
}
