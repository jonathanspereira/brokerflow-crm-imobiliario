import { Router } from 'express'
import { leadsController } from '../controllers/leads.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

/**
 * @swagger
 * /api/v1/leads:
 *   get:
 *     summary: Listar todos os leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de leads
 */
router.get('/', leadsController.getAll)

/**
 * @swagger
 * /api/v1/leads/finalized:
 *   get:
 *     summary: Listar leads finalizados
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de leads finalizados
 */
router.get('/finalized', leadsController.getFinalized)

/**
 * @swagger
 * /api/v1/leads/{id}:
 *   get:
 *     summary: Obter lead por ID
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Detalhes do lead
 */
router.get('/:id', leadsController.getById)

/**
 * @swagger
 * /api/v1/leads:
 *   post:
 *     summary: Criar novo lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               propertyInterest:
 *                 type: string
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Lead criado com sucesso
 */
router.post('/', leadsController.create)

/**
 * @swagger
 * /api/v1/leads/bulk:
 *   post:
 *     summary: Importar leads em lote (de-para)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leads:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, phone]
 *                   properties:
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     interest:
 *                       type: string
 *     responses:
 *       201:
 *         description: Leads importados
 */
router.post('/bulk', leadsController.createBulkLeads)

/**
 * @swagger
 * /api/v1/leads/{id}:
 *   patch:
 *     summary: Atualizar lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lead atualizado
 */
router.patch('/:id', leadsController.update)

/**
 * @swagger
 * /api/v1/leads/{id}:
 *   delete:
 *     summary: Deletar lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       204:
 *         description: Lead deletado
 */
router.delete('/:id', leadsController.delete)

/**
 * @swagger
 * /api/v1/leads/{id}/status:
 *   patch:
 *     summary: Mover lead para novo estágio
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stage]
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [novo, contato, qualificacao, proposta, negociacao, fechado]
 *     responses:
 *       200:
 *         description: Lead movido para novo estágio
 */
router.patch('/:id/status', leadsController.moveToStage)

/**
 * @swagger
 * /api/v1/leads/{id}/notes:
 *   post:
 *     summary: Adicionar nota ao lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nota adicionada
 */
router.post('/:id/notes', leadsController.addNote)

/**
 * @swagger
 * /api/v1/leads/{id}/finalize:
 *   post:
 *     summary: Finalizar lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [sem_interesse, venda_concluida, nao_respondeu, duplicado, invalido]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead finalizado
 */
router.post('/:id/finalize', leadsController.finalize)

/**
 * @swagger
 * /api/v1/leads/{id}/reopen:
 *   post:
 *     summary: Reabrir lead finalizado
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lead reaberto
 */
router.post('/:id/reopen', leadsController.reopen)

export default router
