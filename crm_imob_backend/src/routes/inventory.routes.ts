import { Router } from 'express'
import { inventoryController } from '../controllers/inventory.controller'

const router = Router()

// Get all properties
router.get('/', inventoryController.getAll)

// Get available properties only
router.get('/available', inventoryController.getAvailable)

// Get properties by project
router.get('/project/:project', inventoryController.getByProject)

// Get book/document from property
router.get('/:id/books/:bookName', inventoryController.getBook)

// Get property by ID
router.get('/:id', inventoryController.getById)

// Format property name
router.get('/:id/format', inventoryController.formatPropertyName)

// Create new property
router.post('/', inventoryController.create)

// Update property
router.patch('/:id', inventoryController.update)

// Delete property
router.delete('/:id', inventoryController.delete)

export default router
