import express from "express"
import chartData from "./chartData"
import download from "./download"
import timeline from "./timeline"

const router = express.Router({ mergeParams: true })

router.use('/', chartData)
router.use('/', timeline)
router.use('/', download)

export default router