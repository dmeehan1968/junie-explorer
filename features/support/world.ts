import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { HomePage } from './pages/HomePage.js';
import { ProjectPage } from './pages/ProjectPage.js';
import { JetBrains } from '../../src/jetbrains.js';
import { Server } from 'http';

export interface ICustomWorld extends World {
  server?: Server;
  serverPort?: number;
  homePage: HomePage;
  projectPage: ProjectPage;
  jetBrainsInstance?: JetBrains;
  setup(): Promise<void>;
  teardown(): Promise<void>;
}

export class CustomWorld extends World implements ICustomWorld {
  server?: Server;
  serverPort?: number;
  _homePage?: HomePage;
  _projectPage?: ProjectPage;
  jetBrainsInstance?: JetBrains;
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
