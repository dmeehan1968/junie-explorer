import { Page } from '@playwright/test'
import { BasePage } from './BasePage.js'

export class HomePage extends BasePage {
  private readonly selectors = {
    pageTitle: 'h1',
    logsDirectoryPath: '[data-testid="logs-directory-path"]',
    projectsList: '[data-testid="projects-list"]',
    projectItem: '[data-testid="project-item"]',
    projectName: '[data-testid="project-name"]',
    ideIcons: '[data-testid="ide-icons"]',
    reloadButton: '[data-testid="reload-button"]',
    ideFilterToolbar: '[data-testid="ide-filter-toolbar"]',
    projectSearchInput: '[data-testid="project-search"]',
    noMatchingProjectsMessage: '[data-testid="no-matching-projects"]',
    emptyProjectsMessage: '[data-testid="empty-projects-message"]'
  };

  constructor(page: Page) {
    super(page);
  }

  async visitHomepage(): Promise<void> {
    await this.navigateTo('http://localhost:3000');
    await this.waitForNavigation();
  }

  async getPageTitle(): Promise<string> {
    return await this.getTitle();
  }

  async getPageHeading(): Promise<string> {
    await this.waitForSelector(this.selectors.pageTitle);
    return await this.getText(this.selectors.pageTitle);
  }

  async isLogsDirectoryPathVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.logsDirectoryPath);
  }

  async getLogsDirectoryPath(): Promise<string> {
    return await this.getText(this.selectors.logsDirectoryPath);
  }

  async isProjectsListVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.projectsList);
  }

  async getProjectsCount(): Promise<number> {
    return await this.page.locator(this.selectors.projectItem).count();
  }

  async areProjectNamesVisible(): Promise<boolean> {
    const projectNames = await this.page.locator(this.selectors.projectName);
    const count = await projectNames.count();
    return count > 0;
  }

  async areIdeIconsVisible(): Promise<boolean> {
    const ideIcons = await this.page.locator(this.selectors.ideIcons);
    const count = await ideIcons.count();
    return count > 0;
  }

  async isReloadButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.reloadButton);
  }

  async isReloadButtonLoading(): Promise<boolean> {
    const reloadButton = this.page.locator(this.selectors.reloadButton);
    const cls = await reloadButton.getAttribute('class')
    return cls?.includes('loading') ?? false
  }

  async clickReloadButton(): Promise<void> {
    await this.click(this.selectors.reloadButton);
  }

  async isIdeFilterToolbarVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.ideFilterToolbar);
  }

  async isProjectSearchInputVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.projectSearchInput);
  }

  async searchProjects(searchText: string): Promise<void> {
    await this.type(this.selectors.projectSearchInput, searchText);
  }

  async isNoMatchingProjectsMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.noMatchingProjectsMessage);
  }

  async isEmptyProjectsMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.emptyProjectsMessage);
  }

  async hoverOverProject(index: number = 0): Promise<void> {
    const projectItems = this.page.locator(this.selectors.projectItem);
    await projectItems.nth(index).hover();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async toggleIdeFilter(ideName: string): Promise<void> {
    const ideFilter = this.page.locator(`[data-ide="${ideName}"]`);
    await ideFilter.click();
  }

  async getVisibleProjectsCount(): Promise<number> {
    const visibleProjects = await this.page.locator(this.selectors.projectItem + ':visible').count();
    return visibleProjects;
  }

  async getFirstIdeFilterName(): Promise<string> {
    const firstIdeFilter = this.page.locator('.ide-filter').first();
    return await firstIdeFilter.getAttribute('data-ide') || '';
  }

  async applyFiltersWithNoResults(): Promise<void> {
    // This method applies filters that should result in no matching projects
    // We'll search for a term that's unlikely to match any project
    await this.searchProjects('zzz_no_match_xyz_123');
  }
}
