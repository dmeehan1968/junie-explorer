import { Page } from '@playwright/test'
import path from "path"

export abstract class BasePage {

  private reloadButtonSelector = '[data-testid="reload-button"]' as const

  constructor(protected readonly page: Page, protected readonly baseUrl: string) {
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async visit(relativePath: string = ''): Promise<void> {
    await this.navigateTo(path.join(this.baseUrl, relativePath));
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async waitForSelector(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    await this.page.fill(selector, text);
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async isReloadButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.reloadButtonSelector)
  }

  async isReloadButtonLoading(): Promise<boolean> {
    const reloadButton = this.page.locator(this.reloadButtonSelector)
    const cls = await reloadButton.getAttribute('class')
    return cls?.includes('loading') ?? false
  }

  async clickReloadButton(): Promise<void> {
    await this.click(this.reloadButtonSelector)
  }
}