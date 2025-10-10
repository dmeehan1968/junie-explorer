/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { z } from "zod"
import { CollapseIcon } from "./collapseIcon.js"

export class CollapseIconDSL {
  private readonly pixelSchema = z
    .string()
    .regex(/^(-?\d+(?:\.\d+)?)px$/, 'Must be a string like "12px"')
    .transform((s) => Number(s.slice(0, -2)))

  private constructor(private readonly page: Page) {
  }

  static async create(page: Page) {
    await page.setContent(await <CollapseIcon />)
    return new CollapseIconDSL(page)
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

}

export const test = base.extend<{ collapseIcon: CollapseIconDSL }>({
  collapseIcon: async ({ page }, use) => {
    return use(await CollapseIconDSL.create(page))
  }
})

