/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { ContextSizeSection } from "./contextSizeSection.js"

export type ContextSizeProps = {
  showIncludeAllTasks: boolean
}

const DefaultProps: ContextSizeProps = {
  showIncludeAllTasks: false,
}

export class ContextSizeDSL {
  private constructor(private readonly page: Page, private props: ContextSizeProps) {}

  static async create(page: Page, props: Partial<ContextSizeProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <ContextSizeSection {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ContextSizeDSL(page, merged)
  }

  private async render() {
    const body = await <ContextSizeSection {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<ContextSizeProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  // Convenience setters
  async setShowIncludeAllTasks(v: boolean) { await this.setProps({ showIncludeAllTasks: v }) }

  // Locators
  get section() { return this.page.getByTestId('context-size-section') }
  get header() { return this.page.getByTestId('context-size-header') }
  get title() { return this.header.locator('h3') }
  get toggleLabel() { return this.header.locator('.collapsible-toggle') }
  get content() { return this.page.locator('.collapsible-content') }
  get providerFilters() { return this.page.locator('#context-size-provider-filters') }
  get allTasksToggle() { return this.page.locator('#context-size-all-tasks-toggle') }
  get allTasksLabel() { return this.page.locator('label:has(#context-size-all-tasks-toggle) .label-text') }
  get canvas() { return this.page.locator('#context-size-chart') }
}

export const test = base.extend<{ contextSize: ContextSizeDSL }>({
  contextSize: async ({ page }, use) => {
    await use(await ContextSizeDSL.create(page))
  }
})
