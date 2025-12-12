import { JunieExplorer } from "./app/junieExplorer"
import { JetBrains } from "./jetbrains"
import { Task } from "./Task"

export interface ServerOptions {
  jetBrainsInstance?: JetBrains
  jetBrainsLogPath?: string
  concurrency?: number
  port?: number
  preload?: boolean
  homeDir?: string
}

export async function createServer(options: ServerOptions) {
  const {
    jetBrainsInstance = new JetBrains({ logPath: options.jetBrainsLogPath, homeDir: options.homeDir }),
    concurrency,
    port: configuredPort,
    preload = true,
  } = options

  const port = configuredPort ?? 3000

  Task.setConfiguredConcurrency(concurrency)

  const app = new JunieExplorer(jetBrainsInstance)

  // Initialize app state if requested
  if (preload) {
    await jetBrainsInstance.preload()
  }

  return { app, jetBrainsInstance, port }
}