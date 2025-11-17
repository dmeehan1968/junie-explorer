/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml"
import { Breadcrumb, type BreadcrumbOptions, type BreadcrumbItem } from "./breadcrumb"

export type BreadcrumbProps = BreadcrumbOptions

const DefaultItems: BreadcrumbItem[] = [
  { label: 'Home', href: '/', testId: 'bc-home' },
  { label: 'Section', href: '/section', testId: 'bc-section' },
  { label: 'Current', testId: 'bc-current' },
]

const DefaultProps: BreadcrumbProps = {
  items: DefaultItems,
  className: undefined,
}

export class BreadcrumbDSL {
  private constructor(private readonly page: Page, private props: BreadcrumbProps) {}

  static async create(page: Page, props: Partial<BreadcrumbProps> = {}) {
    const merged: BreadcrumbProps = { ...DefaultProps, ...props, items: props.items ?? DefaultItems }
    const body = await <Breadcrumb {...merged} />
    await page.setContent(wrapHtml(body))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new BreadcrumbDSL(page, merged)
  }

  private async render() {
    const body = await <Breadcrumb {...this.props} />
    await this.page.setContent(wrapHtml(body))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  async setProps(props: Partial<BreadcrumbProps>) {
    this.props = { ...this.props, ...props, items: props.items ?? this.props.items }
    await this.render()
  }

  // Convenience setters
  async setItems(items: BreadcrumbItem[]) { await this.setProps({ items }) }
  async setClassName(className?: string) { await this.setProps({ className }) }

  // Locators
  get nav() { return this.page.getByTestId('breadcrumb-navigation') }
  get list() { return this.page.locator('nav[aria-label="breadcrumb"] ul') }
  get listItems() { return this.page.locator('nav[aria-label="breadcrumb"] ul > li') }
  itemByTestId(testId: string) { return this.page.getByTestId(testId) }
  linkByIndex(index: number) { return this.listItems.nth(index).locator('a') }
}

export const test = base.extend<{ breadcrumb: BreadcrumbDSL }>({
  breadcrumb: async ({ page }, use) => {
    await use(await BreadcrumbDSL.create(page))
  }
})
