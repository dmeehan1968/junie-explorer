import express from "express"
import download from "./download"
import timeline from "./timeline"

const router = express.Router({ mergeParams: true })

router.use('/', timeline)
router.use('/', download)

export default router