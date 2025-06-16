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

  private baseUrl: string;

  constructor(page: Page, baseUrl: string = 'http://localhost:3000') {
    super(page);
    this.baseUrl = baseUrl;
  }

  async visitHomepage(): Promise<void> {
    await this.navigateTo(this.baseUrl);
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

  async getSelectedIdeFilters(): Promise<string[]> {
    // Get all enabled IDE filters (those without the 'ide-filter-disabled' class)
    const enabledFilters = await this.page.locator('.ide-filter:not(.ide-filter-disabled)').all();
    const filterNames: string[] = [];

    for (const filter of enabledFilters) {
      const ideName = await filter.getAttribute('data-ide');
      if (ideName) {
        filterNames.push(ideName);
      }
    }

    return filterNames;
  }

  async applyIdeFilters(ideNames: string[]): Promise<void> {
    // Apply multiple IDE filters
    for (const ideName of ideNames) {
      await this.toggleIdeFilter(ideName);
    }
  }

  async refreshPage(): Promise<void> {
    await this.page.reload();
    await this.waitForNavigation();
  }

  async areIdeFiltersSelected(expectedFilters: string[]): Promise<boolean> {
    const selectedFilters = await this.getSelectedIdeFilters();

    // Check if all expected filters are selected
    for (const expectedFilter of expectedFilters) {
      if (!selectedFilters.includes(expectedFilter)) {
        return false;
      }
    }

    // Check if no unexpected filters are selected
    for (const selectedFilter of selectedFilters) {
      if (!expectedFilters.includes(selectedFilter)) {
        return false;
      }
    }

    return true;
  }

  // Mobile device testing methods
  async setMobileViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  }

  async isLayoutResponsive(): Promise<boolean> {
    // Check if the layout adjusts properly for mobile
    // This could check for specific CSS classes, element visibility, or layout changes
    const projectsList = this.page.locator(this.selectors.projectsList);
    const computedStyle = await projectsList.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });

    // On mobile, the layout should still be visible and properly formatted
    return computedStyle !== 'none' && await this.isVisible(this.selectors.projectsList);
  }

  async areProjectsAccessibleOnMobile(): Promise<boolean> {
    // Check if all projects are still accessible on mobile
    const projectsCount = await this.getProjectsCount();
    const visibleProjectsCount = await this.getVisibleProjectsCount();

    // All projects should be accessible (visible) on mobile
    return projectsCount > 0 && visibleProjectsCount === projectsCount;
  }

  // Hover effect testing methods
  async getProjectBackgroundColor(index: number = 0): Promise<string> {
    const projectItems = this.page.locator(this.selectors.projectItem);
    return await projectItems.nth(index).evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
  }

  async getProjectTransform(index: number = 0): Promise<string> {
    const projectItems = this.page.locator(this.selectors.projectItem);
    return await projectItems.nth(index).evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
  }

  async hasProjectColorChanged(index: number = 0, originalColor: string): Promise<boolean> {
    const currentColor = await this.getProjectBackgroundColor(index);
    return currentColor !== originalColor;
  }

  async hasProjectMoved(index: number = 0, originalTransform: string): Promise<boolean> {
    const currentTransform = await this.getProjectTransform(index);
    return currentTransform !== originalTransform;
  }

  async waitForProjectsToLoad(): Promise<void> {
    await this.waitForSelector(this.selectors.projectItem);
  }
}
