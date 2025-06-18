import { Page } from '@playwright/test'
import { BasePage } from './BasePage.js'

export class ProjectPage extends BasePage {
  private readonly selectors = {
    pageTitle: 'h1',
    issuesList: '[data-testid="issues-list"]',
    reloadButton: '[data-testid="reload-button"]',
    costOverTimeGraph: '[data-testid="cost-over-time-graph"]',
    projectSummaryTable: '[data-testid="project-summary-table"]',
    summaryInputTokens: '[data-testid="summary-input-tokens"]',
    summaryOutputTokens: '[data-testid="summary-output-tokens"]',
    summaryCacheTokens: '[data-testid="summary-cache-tokens"]',
    summaryCost: '[data-testid="summary-cost"]',
    summaryTotalTime: '[data-testid="summary-total-time"]',
    summaryElapsedTime: '[data-testid="summary-elapsed-time"]',
    issueName: '[data-testid="issue-name"]',
    issueState: '[data-testid="issue-state"]',
    issueCreatedDate: '[data-testid="issue-created-date"]',
    issueInputTokens: '[data-testid="issue-input-tokens"]',
    issueOutputTokens: '[data-testid="issue-output-tokens"]',
    issueCacheTokens: '[data-testid="issue-cache-tokens"]',
    issueCost: '[data-testid="issue-cost"]',
    issueTotalTime: '[data-testid="issue-total-time"]',
    issueLink: '[data-testid="issue-link"]',
    noIssuesMessage: '[data-testid="no-issues-message"]'
  };

  constructor(page: Page, baseUrl: string) {
    super(page, baseUrl);
  }

  async visit(projectName: string): Promise<void> {
    await super.visit(`project/${encodeURIComponent(projectName)}`);
  }

  async getPageTitle(): Promise<string> {
    return await this.getTitle();
  }

  async isIssuesListVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.issuesList);
  }

  async isCostOverTimeGraphVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.costOverTimeGraph);
  }

  async isCostOverTimeGraphNotDisplayed(): Promise<boolean> {
    const isVisible = await this.isVisible(this.selectors.costOverTimeGraph);
    return !isVisible;
  }

  async isProjectSummaryTableVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.projectSummaryTable);
  }

  async doesSummaryTableDisplayAggregatedMetrics(): Promise<boolean> {
    const hasInputTokens = await this.isVisible(this.selectors.summaryInputTokens);
    const hasOutputTokens = await this.isVisible(this.selectors.summaryOutputTokens);
    const hasCacheTokens = await this.isVisible(this.selectors.summaryCacheTokens);
    const hasCost = await this.isVisible(this.selectors.summaryCost);
    const hasTotalTime = await this.isVisible(this.selectors.summaryTotalTime);
    const hasElapsedTime = await this.isVisible(this.selectors.summaryElapsedTime);

    return hasInputTokens && hasOutputTokens && hasCacheTokens && hasCost && hasTotalTime && hasElapsedTime;
  }

  async areNumericValuesFormattedWithThousandsSeparators(): Promise<boolean> {
    // Check if numeric values contain commas for thousands separators
    const inputTokensText = await this.getText(this.selectors.summaryInputTokens);
    const outputTokensText = await this.getText(this.selectors.summaryOutputTokens);
    const costText = await this.getText(this.selectors.summaryCost);

    // Simple check for comma formatting in large numbers
    return inputTokensText.includes(',') || outputTokensText.includes(',') || costText.includes(',');
  }

  async isElapsedTimeFormattedCorrectly(): Promise<boolean> {
    const elapsedTimeText = await this.getText(this.selectors.summaryElapsedTime);
    // Check if elapsed time contains time units like "days", "hours", "minutes"
    return elapsedTimeText.includes('day') || elapsedTimeText.includes('hour') || elapsedTimeText.includes('minute');
  }

  async isIssueListWithDetailsVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.issuesList);
  }

  async doIssuesDisplayNameAndState(): Promise<boolean> {
    const hasNames = await this.isVisible(this.selectors.issueName);
    const hasStates = await this.isVisible(this.selectors.issueState);
    return hasNames && hasStates;
  }

  async doIssuesDisplayMetrics(): Promise<boolean> {
    const hasCreatedDate = await this.isVisible(this.selectors.issueCreatedDate);
    const hasInputTokens = await this.isVisible(this.selectors.issueInputTokens);
    const hasOutputTokens = await this.isVisible(this.selectors.issueOutputTokens);
    const hasCacheTokens = await this.isVisible(this.selectors.issueCacheTokens);
    const hasCost = await this.isVisible(this.selectors.issueCost);
    const hasTotalTime = await this.isVisible(this.selectors.issueTotalTime);

    return hasCreatedDate && hasInputTokens && hasOutputTokens && hasCacheTokens && hasCost && hasTotalTime;
  }

  async doIssuesDisplayStateWithStyling(): Promise<boolean> {
    // Check if issue states have CSS classes for styling
    const stateElements = await this.page.$$(this.selectors.issueState);
    if (stateElements.length === 0) return false;

    for (const element of stateElements) {
      const className = await element.getAttribute('class');
      if (!className || !className.includes('state-')) {
        return false;
      }
    }
    return true;
  }

  async clickOnFirstIssue(): Promise<void> {
    await this.click(`${this.selectors.issueLink}:first-child`);
  }

  async isNoIssuesMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.noIssuesMessage);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
