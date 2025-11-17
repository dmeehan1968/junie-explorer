import process from "node:process"
import { JunieExplorer } from "./app/junieExplorer"
import { JetBrains } from "./jetbrains"

export interface ServerOptions {
  jetBrainsInstance?: JetBrains
  port?: number
  preload?: boolean
}

export async function createServer(options: ServerOptions = {}) {
  const {
    jetBrainsInstance = new JetBrains({ logPath: process.env.JETBRAINS_LOG_PATH }),
    port = process.env.PORT || 3000,
    preload = true,
  } = options

  const app = new JunieExplorer(jetBrainsInstance)

  // Initialize app state if requested
  if (preload) {
    await jetBrainsInstance.preload()
  }

  return { app, jetBrainsInstance, port }
}