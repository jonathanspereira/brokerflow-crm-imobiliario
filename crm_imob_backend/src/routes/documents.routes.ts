import { Router } from "express"
import { documentController } from "../controllers/document.controller"
import { authenticateToken } from "../middleware/auth.middleware"

const router = Router()

// Get all models
router.get("/models", authenticateToken, documentController.getModels)

// Create new model
router.post("/models", authenticateToken, documentController.createModel)

// Update model
router.patch("/models/:id", authenticateToken, documentController.updateModel)

// Delete model
router.delete("/models/:id", authenticateToken, documentController.deleteModel)

// Prepare draft from model
router.post("/prepare-draft", authenticateToken, documentController.prepareDraft)

// Save document to history
router.post("/history", authenticateToken, documentController.saveToHistory)

// Get document history for a lead
router.get("/history/lead/:leadId", authenticateToken, documentController.getHistory)

// Get specific document by ID
router.get("/history/:id", authenticateToken, documentController.getDocumentById)

// Update existing document
router.patch("/history/:id", authenticateToken, documentController.updateDocument)

export default router
