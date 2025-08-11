import express from "express"
import download from "./download.js"
import timeline from "./timeline.js"
import task from "./task.js"

const router = express.Router({ mergeParams: true })

router.use('/', timeline)
router.use('/', download)
router.use('/', task)

export default router