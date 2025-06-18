import { IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber'
import { chromium, Page } from '@playwright/test'
import { Server } from 'http'
import { JetBrains } from '../../src/jetbrains.js'
import { Breadcrumb } from "./Breadcrumb.js"
import { HomePage } from './pages/HomePage.js'
import { IssuePage } from "./pages/IssuePage.js"
import { ProjectPage } from './pages/ProjectPage.js'
import { ReloadButton } from "./ReloadButton.js"

export class IdeIcons {
  constructor(private readonly page: Page) {
  }

  async areVisible(): Promise<boolean> {
    return this.page.isVisible('[data-testid="ide-icons"]')
  }
}

export interface ICustomWorld extends World {
  server?: Server;
  serverPort?: number;
  homePage: HomePage;
  projectPage: ProjectPage;
  issuePage: IssuePage;
  reloadButton: ReloadButton;
  breadcrumb: Breadcrumb;
  ideIcons: IdeIcons;
  jetBrainsInstance?: JetBrains;
  setup(): Promise<void>;
  teardown(): Promise<void>;
}

export class CustomWorld extends World implements ICustomWorld {
  server?: Server;
  serverPort?: number;
  _homePage?: HomePage;
  _projectPage?: ProjectPage;
  _issuePage?: IssuePage;
  _reloadButton?: ReloadButton;
  _breadcrumb?: Breadcrumb;
  _ideIcons?: IdeIcons;
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

  get issuePage() {
    if (!this._issuePage) {
      throw new Error('IssuePage not initialized');
    }
    return this._issuePage;
  }

  get reloadButton() {
    if (!this._reloadButton) {
      throw new Error('ReloadButton not initialized');
    }
    return this._reloadButton;
  }

  get breadcrumb() {
    if (!this._breadcrumb) {
      throw new Error('Breadcrumb not initialized');
    }
    return this._breadcrumb;
  }

  get ideIcons() {
    if (!this._ideIcons) {
      throw new Error('IdeIcons not initialized');
    }
    return this._ideIcons;
  }

  async setup(): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    this._homePage = new HomePage(page, this.baseUrl);
    this._projectPage = new ProjectPage(page, this.baseUrl);
    this._issuePage = new IssuePage(page, this.baseUrl);

    this._reloadButton = new ReloadButton(page);
    this._breadcrumb = new Breadcrumb(page);
    this._ideIcons = new IdeIcons(page);

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
