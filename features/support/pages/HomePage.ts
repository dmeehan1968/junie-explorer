import { BasePage } from './BasePage.js'

export class HomePage extends BasePage {
  private projectBackgroundColor?: string;
  private projectTransform?: string;
  private ideFilters?: string[];

  private readonly selectors = {
    pageTitle: 'h1',
    logsDirectoryPath: '[data-testid="logs-directory-path"]',
    projectsList: '[data-testid="projects-list"]',
    projectItem: '[data-testid="project-item"]',
    projectName: '[data-testid="project-name"]',
    ideIcons: '[data-testid="ide-icons"]',
    ideFilterToolbar: '[data-testid="ide-filter-toolbar"]',
    ideFilter: '[data-testid="ide-filter"]',
    projectSearchInput: '[data-testid="project-search"]',
    noMatchingProjectsMessage: '[data-testid="no-matching-projects"]',
    emptyProjectsMessage: '[data-testid="empty-projects-message"]'
  } as const;

  async getPageTitle(): Promise<string> {
    return await this.getTitle();
  }

  async isLogsDirectoryPathVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.logsDirectoryPath);
  }

  async isProjectsListVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.projectsList);
  }

  async projectCount(): Promise<number> {
    return await this.page.locator(this.selectors.projectItem).count();
  }

  async areProjectNamesVisible(): Promise<boolean> {
    const projectNames = await this.page.locator(this.selectors.projectName);
    const count = await projectNames.count();
    return count > 0;
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

  async toggleIdeFilter(ideName: string): Promise<void> {
    const ideFilter = this.page.locator(`${this.selectors.ideFilter}[data-ide="${ideName}"]`);
    await ideFilter.click();
  }

  async visibleProjectCount(): Promise<number> {
    return await this.page.locator(this.selectors.projectItem + ':visible').count();
  }

  async getFirstIdeFilterName(): Promise<string> {
    const firstIdeFilter = this.page.locator(this.selectors.ideFilter).first();
    return await firstIdeFilter.getAttribute('data-ide') || '';
  }

  async applyFiltersWithNoResults(): Promise<void> {
    // This method applies filters that should result in no matching projects
    // We'll search for a term that's unlikely to match any project
    await this.searchProjects('zzz_no_match_xyz_123');
  }

  async getSelectedIdeFilters(): Promise<string[]> {
    // Get all enabled IDE filters (those without the 'ide-filter-disabled' class)
    const enabledFilters = await this.page.locator(`${this.selectors.ideFilter}:not(.ide-filter-disabled)`).all();
    const filterNames: string[] = [];

    for (const filter of enabledFilters) {
      const ideName = await filter.getAttribute('data-ide');
      if (ideName) {
        filterNames.push(ideName);
      }
    }

    return filterNames;
  }

  async memoizeIdeFilters(): Promise<void> {
    this.ideFilters = await this.getSelectedIdeFilters();
  }

  async refreshPage(): Promise<void> {
    await this.page.reload();
  }

  async areIdeFiltersSelected(): Promise<boolean> {
    if (!this.ideFilters) {
      throw new Error('Ide filters not memoized');
    }

    const selectedFilters = await this.getSelectedIdeFilters();

    // Check if all expected filters are selected
    for (const expectedFilter of this.ideFilters) {
      if (!selectedFilters.includes(expectedFilter)) {
        return false;
      }
    }

    // Check if no unexpected filters are selected
    for (const selectedFilter of selectedFilters) {
      if (!this.ideFilters.includes(selectedFilter)) {
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
    const projectsCount = await this.projectCount();
    const visibleProjectsCount = await this.visibleProjectCount();

    // All projects should be accessible (visible) on mobile
    return projectsCount > 0 && visibleProjectsCount === projectsCount;
  }

  // Hover effect testing methods
  async memoizeProjectBackgroundColor(index: number = 0): Promise<void> {
    const projectItems = this.page.locator(this.selectors.projectItem);
    this.projectBackgroundColor = await projectItems.nth(index).evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    })
  }

  async memoizeProjectTransform(index: number = 0): Promise<void> {
    const projectItems = this.page.locator(this.selectors.projectItem);
    this.projectTransform = await projectItems.nth(index).evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
  }

  async hasProjectBackgroundColorChanged(index: number): Promise<boolean> {
    if (!this.projectBackgroundColor) {
      throw new Error('Project background color not memoized');
    }

    // Get the current color while maintaining hover state
    const projectItems = this.page.locator(this.selectors.projectItem);

    // First, ensure we're hovering over the element
    await projectItems.nth(index).hover();

    // Wait a bit for the transition to complete
    await this.page.waitForTimeout(100);

    const currentColor = await projectItems.nth(index).evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    return currentColor !== this.projectBackgroundColor;
  }

  async hasProjectMoved(index: number = 0): Promise<boolean> {
    // Get the current transform while maintaining hover state
    const projectItems = this.page.locator(this.selectors.projectItem);

    // First, ensure we're hovering over the element
    await projectItems.nth(index).hover();

    // Wait a bit for the transition to complete
    await this.page.waitForTimeout(100);

    const currentTransform = await projectItems.nth(index).evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    return currentTransform !== this.projectTransform;
  }

  async waitForProjectsToLoad(): Promise<void> {
    await this.waitForSelector(this.selectors.projectItem);
  }

  async clickProjectName(name: string): Promise<void> {
    await this.click(`[data-testid="project-link-${name}"]`);
  }
}
