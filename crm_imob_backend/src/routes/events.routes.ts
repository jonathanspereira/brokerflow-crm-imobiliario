import { Router } from 'express'
import { EventsController } from '../controllers/events.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()
const eventsController = new EventsController()

// All routes require authentication
router.use(authenticateToken)

// Get all events
router.get('/', (req, res) => eventsController.getAll(req, res))

// Get event by ID
router.get('/:id', (req, res) => eventsController.getById(req, res))

// Create new event
router.post('/', (req, res) => eventsController.create(req, res))

// Update event
router.patch('/:id', (req, res) => eventsController.update(req, res))

// Delete event
router.delete('/:id', (req, res) => eventsController.delete(req, res))

export default router
