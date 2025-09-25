import { Browser, chromium, Page } from "@playwright/test"
import { afterAll, afterEach, beforeEach, beforeAll, describe, it, expect } from "bun:test"
import { Server } from "http"
import { BrowserContext } from "playwright"
import { JunieExplorer } from "../app/junieExplorer.js"
import { JetBrains } from "../jetbrains.js"

interface ProjectTable {
  navigateTo(url: string): Promise<void>
  search(text: string): Promise<void>
  selectRow(index: number): Promise<void>
  selectedRowCount: Promise<number>
  visibleRowCount: Promise<number>
  rowCount: Promise<number>
  exists: Promise<boolean>
}

class ProjectTableDSL implements ProjectTable {

  constructor(private readonly page: Page, private readonly baseUrl: string) {
  }

  async navigateTo(url: string): Promise<void> {
    const target = new URL(url, this.baseUrl).toString()
    await this.page.goto(target)
  }

  async search(text: string): Promise<void> {
    await this.page.fill('input[data-testid="project-search"]', text)
    await this.page.waitForFunction(async (text) => {
      const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('#projects-table tbody tr'))
      return rows.length > 0 && rows.every(row => {
        const projectName = row.querySelector('[data-testid="project-name"]')
        return row.style.display !== 'none' && projectName?.textContent?.toLowerCase().includes(text.toLowerCase())
      })
    }, text)
  }

  async selectRow(index: number): Promise<void> {
    console.log(await this.page.locator(`#projects-table tbody tr:nth-child(${index})`)
      .nth(0)
      .innerHTML()
    )

  }

  get exists() {
    return this.page.isVisible('#projects-table')
  }

  get rowCount() {
    return this.page.$$eval('#projects-table tbody tr', rows => rows.length)
  }

  get selectedRowCount() {
    return this.page.$$eval('#projects-table tbody tr.selected', rows => rows.length)
  }

  get visibleRowCount() {
    return this.page.$$eval('#projects-table tbody tr >> visible=true', rows => rows.length)
  }
}

describe("projectTable", () => {

  let projectTable: ProjectTableDSL
  let browser: Browser
  let context: BrowserContext
  let page: Page
  let junieExplorer: JunieExplorer
  let server: Server

  beforeAll(async () => {
    junieExplorer = new JunieExplorer(new JetBrains({ logPath: './fixtures' }))
    server = await new Promise(resolve => {
      junieExplorer.listen(0, resolve)
    })
    browser = await chromium.launch({ headless: false, slowMo: 2000 })
  })

  beforeEach(async () => {
    context = await browser.newContext()
    page = await context.newPage()
    const address = server.address()
    if (address === null || typeof address === 'string') {
      throw new Error('Server failed to start - ' + address)
    }
    projectTable = new ProjectTableDSL(page, `http://localhost:${address.port}`)
  })

  afterEach(async () => {
    await page.close()
    await context.close()
  })

  afterAll(async () => {
    await browser.close()
    await new Promise(resolve => {
      server.close(() => resolve(undefined))
    })
  })

  it('should exist', async () => {
    await projectTable.navigateTo('/')
    expect(projectTable.exists).resolves.toBe(true)
    expect(projectTable.rowCount).resolves.toBeGreaterThan(0)
  })

  it('should find matching projects', async () => {
    await projectTable.navigateTo('/')
    await projectTable.search('test')
    expect(projectTable.visibleRowCount).resolves.toEqual(1)
  })

  it('should allow selection', async () => {
    await projectTable.navigateTo('/')
    await projectTable.selectRow(1)
    expect(projectTable.selectedRowCount).resolves.toEqual(1)
  })

})
