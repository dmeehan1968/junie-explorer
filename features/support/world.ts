import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { HomePage } from './pages/HomePage.js';
import { JetBrains } from '../../src/jetbrains.js';
import { Server } from 'http';

export interface ICustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  homePage?: HomePage;
  appliedFilters?: string[];
  originalBackgroundColor?: string;
  originalTransform?: string;
  server?: Server;
  jetBrainsInstance?: JetBrains;
  serverPort?: number;
  init(): Promise<void>;
  cleanup(): Promise<void>;
}

export class CustomWorld extends World implements ICustomWorld {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  homePage?: HomePage;
  appliedFilters?: string[];
  originalBackgroundColor?: string;
  originalTransform?: string;
  server?: Server;
  jetBrainsInstance?: JetBrains;
  serverPort?: number;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    const baseUrl = `http://localhost:${this.serverPort}`;
    this.homePage = new HomePage(this.page, baseUrl);
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
