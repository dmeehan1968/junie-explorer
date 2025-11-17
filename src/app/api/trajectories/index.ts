import express from "express"
import download from "./download"
import timeline from "./timeline"
import modelPerformance from "./modelPerformance"
import contextSize from "./contextSize"

const router = express.Router({ mergeParams: true })

router.use('/', download)
router.use('/', timeline)
router.use('/', modelPerformance)
router.use('/', contextSize)

export default router