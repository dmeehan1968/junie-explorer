import { test as base, Page, Locator, expect } from "@playwright/test"

export class ThemeSwitcherDSL {
  constructor(private readonly page: Page) {}

  navigateTo(url: string = "/") {
    return this.page.goto(url)
  }

  get dropdownButton(): Locator {
    return this.page.locator('[data-testid="theme-switcher"]')
  }

  get dropdownMenu(): Locator {
    return this.page.locator('div.dropdown ul[tabindex="0"]')
  }

  themeItem(name: string): Locator {
    const id = name.toLowerCase()
    return this.page.locator(`[data-testid="theme-${id}"]`)
  }

  async openDropdown() {
    await this.dropdownButton.click()
  }

  async hoverTheme(name: string) {
    await this.themeItem(name).hover()
  }

  async clickTheme(name: string) {
    await this.themeItem(name).click()
  }

  async moveMouseOut() {
    // Move mouse to the top-left corner to trigger mouseout on the dropdown menu
    await this.page.mouse.move(0, 0)
  }

  get currentTheme() {
    return this.page.locator('html').getAttribute('data-theme')
  }

  get allThemeItems(): Locator {
    // Restrict to items inside the dropdown menu to avoid matching the trigger button
    return this.dropdownMenu.locator('[data-testid^="theme-"]')
  }
}

export const test = base.extend<{ themeSwitcher: ThemeSwitcherDSL }>({
  themeSwitcher: async ({ page }, use) => {
    await use(new ThemeSwitcherDSL(page))
  }
})
