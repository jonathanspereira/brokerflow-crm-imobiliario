import { Router } from "express"
import whatsappRoutes from "./whatsapp.routes"
import authRoutes from "./auth.routes"
import leadsRoutes from "./leads.routes"
import eventsRoutes from "./events.routes"
import inventoryRoutes from "./inventory.routes"
import teamsRoutes from "./teams.routes"
import documentsRoutes from "./documents.routes"

const router = Router()

router.use("/auth", authRoutes)
router.use("/whatsapp", whatsappRoutes)
router.use("/leads", leadsRoutes)
router.use("/events", eventsRoutes)
router.use("/inventory", inventoryRoutes)
router.use("/teams", teamsRoutes)
router.use("/documents", documentsRoutes)

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "API is running" },
    timestamp: new Date().toISOString()
  })
})

export default router
