/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { VersionBanner } from "./versionBanner.js"
import type { Version } from "../jetbrains.js"

export type VersionBannerProps = {
  version?: Version
}

const DefaultProps: VersionBannerProps = {
  version: {
    currentVersion: '1.0.0',
    newVersion: '1.1.0',
    releaseUrl: 'https://example.com/release'
  }
}

export class VersionBannerDSL {
  private constructor(private readonly page: Page, private props: VersionBannerProps) {}

  static async create(page: Page, props: Partial<VersionBannerProps> = {}) {
    const merged = { ...DefaultProps, ...props }
    const body = await <VersionBanner {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new VersionBannerDSL(page, merged)
  }

  private async render() {
    const body = await <VersionBanner {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<VersionBannerProps>) {
    this.props = { ...this.props, ...props }
    await this.render()
  }

  async setVersion(version?: Version) { await this.setProps({ version }) }

  // Locators
  get banner() { return this.page.getByTestId('version-banner') }
  get link() { return this.page.getByTestId('version-link') }
  get messageText() { return this.banner.locator('span.font-medium') }
  classAttr() { return this.banner.getAttribute('class') }
}

export const test = base.extend<{ versionBanner: VersionBannerDSL }>({
  versionBanner: async ({ page }, use) => {
    await use(await VersionBannerDSL.create(page))
  }
})
