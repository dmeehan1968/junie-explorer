import { BasePage } from "./BasePage.js"

export class IssuePage extends BasePage {
  private readonly selectors = {
    pageTitle: 'h1',
    tasksList: '[data-testid="tasks-list"]',
    ideIcons: '[data-testid="ide-icons"]',
    issueDate: '[data-testid="issue-date"]',
    issueState: '[data-testid="issue-state"]',
    taskDetails: '[data-testid="task-details"]',
    taskMetrics: '[data-testid="task-metrics"]',
    taskDescription: '[data-testid="task-description"]',
    taskItem: '[data-testid="task-item"]',
    noTasksMessage: '[data-testid="no-tasks-message"]',
    jsonButton: '[data-testid="json-button"]',
    jsonViewer: '[data-testid="json-viewer"]'
  } as const;

  async getPageTitle(): Promise<string> {
    return await this.getText(this.selectors.pageTitle);
  }

  async isTasksListVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.tasksList);
  }

  async isIssueDateVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.issueDate);
  }

  async isIssueStateVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.issueState);
  }

  async areTaskDetailsVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.taskDetails);
  }

  async areTaskMetricsVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.taskMetrics);
  }

  async isTaskDescriptionVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.taskDescription);
  }

  async clickOnFirstTask(): Promise<void> {
    await this.click(`${this.selectors.taskItem}:first-child [data-testid="steps-button"]`);
  }

  async isNoTasksMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.noTasksMessage);
  }

  async areJsonButtonsVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.jsonButton);
  }

  async clickJsonButton(): Promise<void> {
    await this.click(`${this.selectors.jsonButton}`);
  }

  async isJsonViewerVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.jsonViewer);
  }

  async isJsonViewerCollapsed(): Promise<boolean> {
    const viewer = await this.page.$(this.selectors.jsonViewer);
    if (!viewer) return false;

    const isCollapsed = await viewer.evaluate(el => {
      return el.classList.contains('collapsed') || 
             el.getAttribute('data-collapsed') === 'true' ||
             getComputedStyle(el).display === 'none';
    });

    return isCollapsed;
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

}
