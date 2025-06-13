import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import homeRoutes from './routes/homeRoutes.js'
import issueRoutes from './routes/issueRoutes.js'
import notFoundRoutes from './routes/notFoundRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import { initializeAppState, refreshAppState } from './utils/appState.js'
import { jetBrains } from "./v2/jetbrains.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Serve static files
app.use(express.static(path.join(__dirname, '../public')))

// Add refresh endpoint
app.get('/refresh', (req, res) => {
  // refreshAppState()
  jetBrains.reload()
  res.redirect(req.headers.referer || '/')
})


// Register routes
app.use('/', homeRoutes)
app.use('/', projectRoutes)
app.use('/', issueRoutes)
app.use('/', taskRoutes)

// Add not found page (must be after routes)
app.use(notFoundRoutes)

// Initialize app state and start the server
jetBrains.preload()
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
