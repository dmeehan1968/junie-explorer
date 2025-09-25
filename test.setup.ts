import { Browser, chromium, Page } from "@playwright/test"
import { afterAll, beforeAll } from "bun:test"
import { Server } from "http"
import { BrowserContext } from "playwright"
import { JunieExplorer } from "./src/app/junieExplorer.js"
import { JetBrains } from "./src/jetbrains.js"

let browser: Browser
let context: BrowserContext
export let testPage: Page
let junieExplorer: JunieExplorer
let server: Server
export let testServerAddress: string
export let jetBrainsTestInstance: JetBrains

beforeAll(async () => {
  if (!jetBrainsTestInstance) {
    jetBrainsTestInstance = new JetBrains({ logPath: './fixtures' })
    await jetBrainsTestInstance.preload()
  }
  junieExplorer ??= new JunieExplorer(jetBrainsTestInstance)
  server ??= await new Promise(resolve => {
    junieExplorer.listen(0, resolve)
  })
  if (!testServerAddress) {
    const address = server.address()
    if (address === null || typeof address === 'string') {
      throw new Error('Server failed to start - ' + address)
    }
    testServerAddress = `http://localhost:${address.port}`
  }
  browser ??= await chromium.launch({ headless: true, /*slowMo: 2000*/ })
  context ??= await browser.newContext()
  testPage ??= await context.newPage()
})

afterAll(async () => {
  await browser.close()
  await new Promise(resolve => {
    server.close(() => resolve(undefined))
  })
  await testPage.close()
  await context.close()
})

