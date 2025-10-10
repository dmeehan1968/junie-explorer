/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { z } from "zod"
import { ExpandIcon } from "./expandIcon.js"
import { wrapHtml } from "../utils/wrapHtml.js"

export class ExpandIconDSL {
  private readonly pixelSchema = z
    .string()
    .regex(/^(-?\d+(?:\.\d+)?)px$/, 'Must be a string like "12px"')
    .transform((s) => Number(s.slice(0, -2)))

  private constructor(private readonly page: Page) {}

  static async create(page: Page) {
    const body = await <ExpandIcon />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ExpandIconDSL(page)
  }

  get svg() {
    return this.page.locator('svg')
  }

  get paths() {
    return this.svg.locator('path')
  }

  get height() {
    return this.svg.getAttribute('height').then(v => this.pixelSchema.parse(v))
  }

  get width(): Promise<number> {
    return this.svg.getAttribute('width').then(v => this.pixelSchema.parse(v))
  }

  get viewBox(): Promise<string | null> {
    return this.svg.getAttribute('viewBox')
  }

  get stroke(): Promise<string | null> {
    return this.svg.getAttribute('stroke')
  }

  get strokeWidth(): Promise<number> {
    return this.svg.getAttribute('stroke-width').then(v => z.coerce.number().parse(v))
  }

  get strokeLineCap(): Promise<string | null> {
    return this.svg.getAttribute('stroke-linecap')
  }

  get strokeLineJoin(): Promise<string | null> {
    return this.svg.getAttribute('stroke-linejoin')
  }
}

export const test = base.extend<{ expandIcon: ExpandIconDSL }>({
  expandIcon: async ({ page }, use) => {
    return use(await ExpandIconDSL.create(page))
  }
})
