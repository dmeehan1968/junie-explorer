import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { HomePage } from './pages/HomePage.js';
import { ProjectPage } from './pages/ProjectPage.js';
import { JetBrains } from '../../src/jetbrains.js';
import { Server } from 'http';

export interface ICustomWorld extends World {
  homePage: HomePage;
  projectPage: ProjectPage;
  appliedFilters?: string[];
  server?: Server;
  jetBrainsInstance?: JetBrains;
  serverPort?: number;
  setup(): Promise<void>;
  teardown(): Promise<void>;
}

export class CustomWorld extends World implements ICustomWorld {
  _homePage?: HomePage;
  _projectPage?: ProjectPage;
  appliedFilters?: string[];
  server?: Server;
  jetBrainsInstance?: JetBrains;
  serverPort?: number;
  teardownActions: (() => Promise<void>)[] = []

  constructor(options: IWorldOptions) {
    super(options);
  }

  get baseUrl() {
    return `http://localhost:${this.serverPort}`;
  }

  get homePage() {
    if (!this._homePage) {
      throw new Error('HomePage not initialized');
    }
    return this._homePage;
  }

  get projectPage() {
    if (!this._projectPage) {
      throw new Error('ProjectPage not initialized');
    }
    return this._projectPage;
  }

  async setup(): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    this._homePage = new HomePage(page, this.baseUrl);
    this._projectPage = new ProjectPage(page, this.baseUrl);

    this.teardownActions.push(async () => page.close());
    this.teardownActions.push(async () => context.close());
    this.teardownActions.push(async () => browser.close());
  }

  async teardown(): Promise<void> {
    for (const teardown of this.teardownActions) {
      await teardown();
    }
  }
}

setWorldConstructor(CustomWorld);
