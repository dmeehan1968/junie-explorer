import { Locator } from "@playwright/test"

export class IssueRowDSL {
  constructor(private readonly row: Locator) {
  }

  get element() {
    return this.row
  }

  locator(selectorOrLocator: string | Locator): Locator {
    return this.row.locator(selectorOrLocator)
  }

  // Checkbox for issue selection (only present when project has metrics)
  get checkbox() {
    return this.locator('input.issue-select')
  }

  async hasCheckbox(): Promise<boolean> {
    return (await this.checkbox.count()) > 0
  }

  // Issue description cell
  get descriptionCell() {
    return this.locator('[data-testid="issue-description"]')
  }

  async getDescriptionText(): Promise<string> {
    const txt = await this.descriptionCell.textContent()
    return (txt || '').trim()
  }

  // Timestamp cell
  get timestampCell() {
    return this.locator('[data-testid="issue-timestamp"]')
  }

  async getTimestampText(): Promise<string> {
    const txt = await this.timestampCell.textContent()
    return (txt || '').trim()
  }

  // Input tokens cell
  get inputTokensCell() {
    return this.locator('[data-testid="issue-input-tokens"]')
  }

  async getInputTokensText(): Promise<string> {
    const txt = await this.inputTokensCell.textContent()
    return (txt || '').trim()
  }

  // Output tokens cell
  get outputTokensCell() {
    return this.locator('[data-testid="issue-output-tokens"]')
  }

  async getOutputTokensText(): Promise<string> {
    const txt = await this.outputTokensCell.textContent()
    return (txt || '').trim()
  }

  // Cache tokens cell
  get cacheTokensCell() {
    return this.locator('[data-testid="issue-cache-tokens"]')
  }

  async getCacheTokensText(): Promise<string> {
    const txt = await this.cacheTokensCell.textContent()
    return (txt || '').trim()
  }

  // Cost cell
  get costCell() {
    return this.locator('[data-testid="issue-cost"]')
  }

  async getCostText(): Promise<string> {
    const txt = await this.costCell.textContent()
    return (txt || '').trim()
  }

  // Total time cell
  get totalTimeCell() {
    return this.locator('[data-testid="issue-total-time"]')
  }

  async getTotalTimeText(): Promise<string> {
    const txt = await this.totalTimeCell.textContent()
    return (txt || '').trim()
  }

  // Status cell
  get statusCell() {
    return this.locator('[data-testid="issue-status"]')
  }

  get statusBadge() {
    return this.statusCell.locator('span')
  }

  async getStatusText(): Promise<string> {
    const txt = await this.statusBadge.textContent()
    return (txt || '').trim()
  }

  // Assistant providers cell
  get assistantProvidersCell() {
    return this.locator('[data-testid="issue-assistant-providers"]')
  }

  get assistantProviderIcons() {
    return this.assistantProvidersCell.locator('[role="img"]')
  }

  async getAssistantProvidersText(): Promise<string> {
    const txt = await this.assistantProvidersCell.textContent()
    return (txt || '').trim()
  }

  // Check if row has onclick handler
  async hasOnclickHandler(): Promise<boolean> {
    const onclick = await this.descriptionCell.getAttribute('onclick')
    return onclick !== null && onclick.length > 0
  }

  // Get checkbox data attributes
  async getCheckboxIssueId(): Promise<string | null> {
    return this.checkbox.getAttribute('data-issue-id')
  }

  async getCheckboxIssueName(): Promise<string | null> {
    return this.checkbox.getAttribute('data-issue-name')
  }
}
