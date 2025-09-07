import express from "express"
import download from "./download.js"
import timeline from "./timeline.js"
import modelPerformance from "./modelPerformance.js"
import contextSize from "./contextSize.js"

const router = express.Router({ mergeParams: true })

router.use('/', download)
router.use('/', timeline)
router.use('/', modelPerformance)
router.use('/', contextSize)

export default router