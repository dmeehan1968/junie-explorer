import express from "express"
import download from "./download.js"
import timeline from "./timeline.js"

const router = express.Router({ mergeParams: true })

router.use('/', timeline)
router.use('/', download)

export default router