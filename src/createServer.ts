import { JunieExplorer } from "./app/junieExplorer"
import { JetBrains } from "./jetbrains"
import { IssueDescriptionStore } from "./services/IssueDescriptionStore"
import { Task } from "./Task"

export interface ServerOptions {
  jetBrainsInstance?: JetBrains
  jetBrainsLogPath?: string
  concurrency?: number
  port?: number
  preload?: boolean
  homeDir: string
}

export async function createServer(options: ServerOptions) {
  const {
    jetBrainsInstance = new JetBrains({ logPath: options.jetBrainsLogPath }),
    concurrency,
    port: configuredPort,
    preload = true,
    homeDir,
  } = options

  const port = configuredPort ?? 3000

  Task.setConfiguredConcurrency(concurrency)

  const issueDescriptionStore = new IssueDescriptionStore(homeDir)
  const app = new JunieExplorer(jetBrainsInstance, issueDescriptionStore)

  // Initialize app state if requested
  if (preload) {
    await jetBrainsInstance.preload()
  }

  return { app, jetBrainsInstance, port }
}