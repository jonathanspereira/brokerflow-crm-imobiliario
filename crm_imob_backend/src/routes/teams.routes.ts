import { Router } from 'express'
import { TeamsController } from '../controllers/teams.controller'
import { authenticateToken } from '../middleware/auth.middleware'
import { checkRole } from '../middleware/checkRole.middleware'

const router = Router()

router.use(authenticateToken)

/**
 * @swagger
 * /api/v1/teams/managers:
 *   get:
 *     summary: Listar gestores disponíveis
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de gestores
 */
router.get('/managers', checkRole(['ADMIN'], { hierarchical: false }), TeamsController.listManagers)

/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: Listar times
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de times
 */
router.get('/', checkRole(['ADMIN', 'GESTOR'], { hierarchical: false }), TeamsController.list)

/**
 * @swagger
 * /api/v1/teams:
 *   post:
 *     summary: Criar novo time
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Time criado com sucesso
 *       402:
 *         description: Limite do plano atingido
 */
router.post('/', checkRole(['ADMIN', 'GESTOR'], { hierarchical: false }), TeamsController.create)

/**
 * @swagger
 * /api/v1/teams/{teamId}/members:
 *   post:
 *     summary: Adicionar membro ao time
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: number
 *               role:
 *                 type: string
 *                 enum: [GESTOR, CORRETOR]
 *     responses:
 *       200:
 *         description: Membro adicionado ao time
 */
router.post('/:teamId/members', checkRole(['ADMIN', 'GESTOR'], { hierarchical: false }), TeamsController.addMember)

/**
 * @swagger
 * /api/v1/teams/{teamId}/manager:
 *   post:
 *     summary: Atribuir gestor ao time
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [managerId]
 *             properties:
 *               managerId:
 *                 type: number
 *     responses:
 *       200:
 *         description: Gestor atribuído ao time
 */
router.post('/:teamId/manager', checkRole(['ADMIN', 'GESTOR'], { hierarchical: false }), TeamsController.setManager)

export default router
