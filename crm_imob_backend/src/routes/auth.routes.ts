import { Router } from "express"
import rateLimit from "express-rate-limit"
import { AuthController } from "../controllers/auth.controller"
import { authenticateToken } from "../middleware/auth.middleware"

// Rate limiter específico para rotas de autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas
  message: 'Muitas tentativas de login. Por favor aguarde 15 minutos.',
  skipSuccessfulRequests: true, // Não conta requests bem-sucedidos
})

const router = Router()

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Criar nova conta de usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Email já existe
 */
router.post("/signup", authLimiter, AuthController.signup)

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", authLimiter, AuthController.login)

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Atualizar tokens (rota com rotação de refresh)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens atualizados com sucesso
 *       401:
 *         description: Refresh token inválido/expirado
 */
router.post("/refresh", authLimiter, AuthController.refresh)

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout bem-sucedido
 */
router.post("/logout", AuthController.logout)

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Solicitar reset de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de reset enviado
 */
router.post("/forgot-password", AuthController.forgotPassword)

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obter dados do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Não autenticado
 */
router.get("/me", authenticateToken, AuthController.me)

/**
 * @swagger
 * /api/v1/auth/profile:
 *   patch:
 *     summary: Atualizar perfil do usuário
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 */
router.patch("/profile", authenticateToken, AuthController.updateProfile)

export default router
