import express from "express"
import download from "./download"
import timeline from "./timeline"
import task from "./task"

const router = express.Router({ mergeParams: true })

router.use('/', timeline)
router.use('/', download)
router.use('/', task)

export default router