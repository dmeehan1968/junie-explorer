import { Server } from "http"
import process from "node:process"
import { createServer } from "./createServer"

const envPort = process.env.PORT
const port = envPort ? Number(envPort) : undefined
const envConcurrency = process.env.CONCURRENCY
const concurrency = envConcurrency ? Number(envConcurrency) : undefined

const { app, port: resolvedPort } = await createServer({
  port: Number.isFinite(port) ? port : undefined,
  jetBrainsLogPath: process.env.JETBRAINS_LOG_PATH,
  concurrency: Number.isFinite(concurrency) ? concurrency : undefined,
})

app.listen(resolvedPort, (server: Server, host, port) => {
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error(`Server failed to start on port ${port} - ${address}`)
  }

  console.log(
      `Server is running on http://${host}:${port}`
  )
})
