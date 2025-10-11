import { Locator } from "@playwright/test"

export class IssueRowDSL {
  constructor(public readonly element: Locator) {}

  // Cells
  get descriptionCell() {
    return this.element.getByTestId('issue-description')
  }

  get timestampCell() {
    return this.element.getByTestId('issue-timestamp')
  }

  get inputTokensCell() {
    return this.element.getByTestId('issue-input-tokens')
  }

  get outputTokensCell() {
    return this.element.getByTestId('issue-output-tokens')
  }

  get cacheTokensCell() {
    return this.element.getByTestId('issue-cache-tokens')
  }

  get costCell() {
    return this.element.getByTestId('issue-cost')
  }

  get totalTimeCell() {
    return this.element.getByTestId('issue-total-time')
  }

  get statusCell() {
    return this.element.getByTestId('issue-status')
  }

  get assistantProvidersCell() {
    return this.element.getByTestId('issue-assistant-providers')
  }

  // Checkbox (only when project.hasMetrics)
  get checkbox() {
    return this.element.locator('input.issue-select')
  }

  async hasCheckbox(): Promise<boolean> {
    return (await this.checkbox.count()) > 0
  }

  async getTimestampText(): Promise<string> {
    const text = await this.timestampCell.textContent()
    return (text || '').trim()
  }

}
