import { Router } from "express"
import { AppRequest, AppResponse } from "../types"

const router = Router()

router.get("/api/issues/:issueId/description", async (req: AppRequest, res: AppResponse) => {
  const { issueId } = req.params
  const store = req.issueDescriptionStore

  if (!store) {
    return res.status(500).json({ error: "Issue description store not available" })
  }

  const description = await store.getDescription(issueId!)
  res.json({ description })
})

router.put("/api/issues/:issueId/description", async (req: AppRequest, res: AppResponse) => {
  const { issueId } = req.params
  const { description } = req.body as { description?: string }
  const store = req.issueDescriptionStore

  if (!store) {
    return res.status(500).json({ error: "Issue description store not available" })
  }

  if (typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string" })
  }

  await store.setDescription(issueId!, description)
  const savedDescription = await store.getDescription(issueId!)

  res.json({ success: true, description: savedDescription })
})

export default router
