import { Request, Response, NextFunction } from "express"
import { Role } from "@prisma/client"
import { prisma } from "../prisma"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { config } from "../config/index"
import { Logger } from "../utils/helpers"

const logger = new Logger("AuthController")

export class AuthController {
  /**
   * Signup - Criar nova conta de usuário com escolha de tipo
   * Body: { name, email, password, userType: "AUTONOMO" | "CORRETOR" | "ADMIN" }
   */
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, userType } = req.body

      // Validação básica
      if (!name || !email || !password || !userType) {
        return res.status(400).json({
          success: false,
          message: "Nome, email, senha e tipo de usuário são obrigatórios",
        })
      }

      // Validar userType
      const validTypes = ["AUTONOMO", "CORRETOR", "ADMIN"]
      if (!validTypes.includes(userType)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de usuário inválido. Use: AUTONOMO, CORRETOR ou ADMIN",
        })
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Email inválido",
        })
      }

      // Validar senha mínima
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "A senha deve ter pelo menos 6 caracteres",
        })
      }

      // Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email já cadastrado",
        })
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10)

      let user

      // Se for AUTONOMO: criar Agência própria
      if (userType === "AUTONOMO") {
        const agencia = await prisma.agencia.create({
          data: {
            name: `${name} - Corretor Autônomo`,
          },
        })

        user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: Role.AUTONOMO,
            agenciaId: agencia.id,
          },
        })

        logger.log(`Novo AUTONOMO criado: ${email} com agência ${agencia.id}`)
      } else if (userType === "CORRETOR") {
        // Para CORRETOR: usar agência padrão
        let agencia = await prisma.agencia.findFirst({
          where: { name: "Agência Padrão" },
        })

        if (!agencia) {
          agencia = await prisma.agencia.create({
            data: {
              name: "Agência Padrão",
            },
          })
        }

        user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: Role.CORRETOR,
            agenciaId: agencia.id,
          },
        })

        logger.log(`Novo CORRETOR criado: ${email}`)
      } else if (userType === "ADMIN") {
        // Para ADMIN: criar com agência padrão
        let agencia = await prisma.agencia.findFirst({
          where: { name: "Agência Padrão" },
        })

        if (!agencia) {
          agencia = await prisma.agencia.create({
            data: {
              name: "Agência Padrão",
            },
          })
        }

        user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: Role.ADMIN,
            agenciaId: agencia.id,
          },
        })

        logger.log(`Novo ADMIN criado: ${email}`)
      }

      res.status(201).json({
        success: true,
        message: "Conta criada com sucesso",
        data: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          role: user!.role,
          agenciaId: user!.agenciaId,
        },
      })
    } catch (error) {
      logger.error("Erro ao criar conta:", error)
      next(error)
    }
  }

  /**
   * Login - Autenticar usuário
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      // Validação básica
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email e senha são obrigatórios",
        })
      }

      // Buscar usuário com agência
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          agencia: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas",
        })
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas",
        })
      }

      // Gerar Access Token (prazo curto) e Refresh Token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        config.jwtSecret,
        { expiresIn: `${config.accessTokenTtlMinutes}m` }
      )

      // Criar refresh token aleatório e armazenar hash
      const rawRefresh = await bcrypt.genSalt(10) // usa salt random como token base
      const refreshHash = await bcrypt.hash(rawRefresh, 10)
      const expires = new Date()
      expires.setDate(expires.getDate() + config.refreshTokenTtlDays)

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshHash,
          expiresAt: expires,
        },
      })

      logger.log(`Usuário logado: ${email} (${user.role})`)

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        data: {
          accessToken,
          refreshToken: rawRefresh,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            agenciaId: user.agenciaId,
            agencia: user.agencia,
          },
        },
      })
    } catch (error) {
      logger.error("Erro ao fazer login:", error)
      next(error)
    }
  }

  /**
   * Refresh - Rotacionar Refresh Token e emitir novo Access Token
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: "Refresh token é obrigatório" })
      }

      // Buscar token válido (não revogado e não expirado)
      const tokens = await prisma.refreshToken.findMany({ where: { revoked: false } })
      // Verificar por comparação de hash (bcrypt.compare)
      let matched: { id: string; userId: string } | null = null
      for (const t of tokens) {
        const ok = await bcrypt.compare(refreshToken, t.tokenHash)
        if (ok) {
          if (t.expiresAt <= new Date()) {
            return res.status(401).json({ success: false, message: "Refresh token expirado" })
          }
          matched = { id: t.id, userId: t.userId }
          break
        }
      }
      if (!matched) {
        return res.status(401).json({ success: false, message: "Refresh token inválido" })
      }

      // Revogar token atual
      await prisma.refreshToken.update({ where: { id: matched.id }, data: { revoked: true } })

      // Emitir novo access + refresh
      const user = await prisma.user.findUnique({ where: { id: matched.userId } })
      if (!user) return res.status(401).json({ success: false, message: "Usuário não encontrado" })

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: `${config.accessTokenTtlMinutes}m` }
      )

      const newRawRefresh = await bcrypt.genSalt(10)
      const newRefreshHash = await bcrypt.hash(newRawRefresh, 10)
      const expires = new Date()
      expires.setDate(expires.getDate() + config.refreshTokenTtlDays)

      await prisma.refreshToken.create({
        data: { userId: user.id, tokenHash: newRefreshHash, expiresAt: expires },
      })

      res.json({
        success: true,
        message: "Tokens atualizados com sucesso",
        data: { accessToken, refreshToken: newRawRefresh },
      })
    } catch (error) {
      logger.error("Erro ao atualizar tokens:", error)
      next(error)
    }
  }

  /**
   * Logout - Finalizar sessão
   */
  static async logout(req: Request, res: Response) {
    res.json({
      success: true,
      message: "Logout realizado com sucesso",
    })
  }

  /**
   * Forgot Password - Recuperar senha
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email é obrigatório",
        })
      }

      // Verificar se usuário existe
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return res.json({
          success: true,
          message: "Se o email existir, você receberá instruções para redefinir sua senha",
        })
      }

      logger.log(`Solicitação de recuperação de senha para: ${email}`)

      res.json({
        success: true,
        message: "Se o email existir, você receberá instruções para redefinir sua senha",
      })
    } catch (error) {
      logger.error("Erro ao processar recuperação de senha:", error)
      next(error)
    }
  }

  /**
   * Me - Obter dados do usuário atual
   */
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Não autorizado",
        })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          agenciaId: true,
          equipeId: true,
          createdAt: true,
          agencia: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        })
      }

      res.json({
        success: true,
        data: user,
      })
    } catch (error) {
      logger.error("Erro ao obter dados do usuário:", error)
      next(error)
    }
  }

  /**
   * Update Profile - Atualizar dados do usuário
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId
      const { name, email, password } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Não autorizado",
        })
      }

      if (!name && !email && !password) {
        return res.status(400).json({
          success: false,
          message: "Nenhum campo para atualizar",
        })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        })
      }

      // Validar novo email se fornecido
      if (email && email !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Email inválido",
          })
        }

        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email já cadastrado",
          })
        }
      }

      // Preparar dados para atualizar
      const updateData: any = {}
      if (name) updateData.name = name
      if (email) updateData.email = email
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: "A senha deve ter pelo menos 6 caracteres",
          })
        }
        updateData.password = await bcrypt.hash(password, 10)
      }

      // Atualizar usuário
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      logger.log(`Perfil atualizado: ${updatedUser.email}`)

      res.json({
        success: true,
        message: "Perfil atualizado com sucesso",
        data: updatedUser,
      })
    } catch (error) {
      logger.error("Erro ao atualizar perfil:", error)
      next(error)
    }
  }
}
