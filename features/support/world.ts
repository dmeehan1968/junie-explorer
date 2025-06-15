import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { HomePage } from './pages/HomePage.js';

export interface ICustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  homePage?: HomePage;
  init(): Promise<void>;
  cleanup(): Promise<void>;
}

export class CustomWorld extends World implements ICustomWorld {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  homePage?: HomePage;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.homePage = new HomePage(this.page);
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

setWorldConstructor(CustomWorld);
