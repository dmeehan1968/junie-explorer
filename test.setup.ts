import { Browser, BrowserContext, chromium, Page } from "@playwright/test"
import { afterAll, beforeAll } from "bun:test"
import { Server } from "http"
import { JunieExplorer } from "./src/app/junieExplorer.js"
import { JetBrains } from "./src/jetbrains.js"

let browser: Browser | undefined
let context: BrowserContext | undefined
export let testPage: Page | undefined
let junieExplorer: JunieExplorer | undefined
let server: Server | undefined
export let testServerAddress: string | undefined
export let jetBrainsTestInstance: JetBrains | undefined

export async function testServer() {
  if (!jetBrainsTestInstance) {
    jetBrainsTestInstance = new JetBrains({ logPath: './fixtures' })
    await jetBrainsTestInstance.preload()
  }
  junieExplorer ??= new JunieExplorer(jetBrainsTestInstance)
  server ??= await new Promise(resolve => {
    junieExplorer!.listen(0, resolve)
  })
  if (!testServerAddress) {
    const address = server!.address()
    if (address === null || typeof address === 'string') {
      throw new Error('Server failed to start - ' + address)
    }
    testServerAddress = `http://localhost:${address.port}`
  }
  browser ??= await chromium.launch({ headless: true, /*slowMo: 2000*/ })
  context ??= await browser.newContext()
  testPage ??= await context.newPage()

  return { browser, context, testPage, server, testServerAddress, jetBrainsTestInstance }
}

export async function testServerCleanup() {
  await browser?.close()
  await testPage?.close()
  await context?.close()

  browser = testPage = context = testServerAddress = undefined
}

beforeAll(testServer)
afterAll(testServerCleanup)
