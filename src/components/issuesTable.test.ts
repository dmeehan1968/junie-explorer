import { expect } from "@playwright/test"
import { test } from "./issuesTable.dsl.js"

// Helper to assert numeric formatted string (digits, commas)
function isFormattedNumber(text: string) {
  return /^\d{1,3}(,\d{3})*$/.test(text)
}

// Helper to assert time formatted as H:MM:SS or M:SS
function isFormattedTime(text: string) {
  return /^(\d+:)?\d{1,2}:\d{2}$/.test(text)
}

test.describe('IssuesTable', async () => {

  test.describe('no-issues project', async () => {
    test.beforeEach(async ({ issuesTable }) => {
      await issuesTable.navigateToProject('no-issues.999999')
    })

    test('should show no issues message and no table', async ({ issuesTable }) => {
      await expect(issuesTable.noIssuesMessage).toBeVisible()
      await expect(issuesTable.table).toHaveCount(0)
    })
  })

  test.describe('no-tasks project (no metrics)', async () => {
    test.beforeEach(async ({ issuesTable }) => {
      await issuesTable.navigateToProject('no-tasks.999999')
    })

    test('should render table without metrics columns and compare button disabled/hidden', async ({ page, issuesTable }) => {
      await expect(issuesTable.table).toBeVisible()
      // Compare button exists but should be disabled only when metrics present; without metrics, it should not be visible
      await expect(issuesTable.compareButton).toHaveCount(0)

      // Header summary shows only total time (no metrics)
      await expect(issuesTable.headerSummaryLabel).toHaveText('Project Summary')
      await expect(issuesTable.headerSummaryTotalTime).toBeVisible()
      await expect(issuesTable.headerSummaryInputTokens).toHaveCount(0)
      await expect(issuesTable.headerSummaryOutputTokens).toHaveCount(0)
      await expect(issuesTable.headerSummaryCacheTokens).toHaveCount(0)
      await expect(issuesTable.headerSummaryCost).toHaveCount(0)

      // Footer summary mirrors header summary
      await expect(issuesTable.footerSummaryLabel).toHaveText('Project Summary')
      await expect(issuesTable.footerSummaryTotalTime).toBeVisible()
      await expect(issuesTable.footerSummaryInputTokens).toHaveCount(0)
      await expect(issuesTable.footerSummaryOutputTokens).toHaveCount(0)
      await expect(issuesTable.footerSummaryCacheTokens).toHaveCount(0)
      await expect(issuesTable.footerSummaryCost).toHaveCount(0)

      // Elapsed time label visible
      await expect(issuesTable.summaryElapsedTime).toBeVisible()
    })
  })

  test.describe('default project (with metrics and issues)', async () => {
    test.beforeEach(async ({ issuesTable }) => {
      await issuesTable.navigateToProject('default.999999')
    })

    test('should render table and compare controls', async ({ issuesTable }) => {
      await expect(issuesTable.table).toBeVisible()
      await expect(issuesTable.compareButton).toBeVisible()
    })

    test('summary header and footer should show numeric metrics and formatted time', async ({ issuesTable }) => {
      await expect(issuesTable.headerSummaryLabel).toHaveText('Project Summary')
      await expect(issuesTable.footerSummaryLabel).toHaveText('Project Summary')

      const headerIn = (await issuesTable.headerSummaryInputTokens.textContent() || '').trim()
      const headerOut = (await issuesTable.headerSummaryOutputTokens.textContent() || '').trim()
      const headerCache = (await issuesTable.headerSummaryCacheTokens.textContent() || '').trim()
      const headerCost = (await issuesTable.headerSummaryCost.textContent() || '').trim()
      const headerTime = (await issuesTable.headerSummaryTotalTime.textContent() || '').trim()

      expect(isFormattedNumber(headerIn)).toBeTruthy()
      expect(isFormattedNumber(headerOut)).toBeTruthy()
      expect(isFormattedNumber(headerCache)).toBeTruthy()
      expect(/^\d+\.(\d{2})$/.test(headerCost)).toBeTruthy()
      expect(isFormattedTime(headerTime)).toBeTruthy()

      const footerIn = (await issuesTable.footerSummaryInputTokens.textContent() || '').trim()
      const footerOut = (await issuesTable.footerSummaryOutputTokens.textContent() || '').trim()
      const footerCache = (await issuesTable.footerSummaryCacheTokens.textContent() || '').trim()
      const footerCost = (await issuesTable.footerSummaryCost.textContent() || '').trim()
      const footerTime = (await issuesTable.footerSummaryTotalTime.textContent() || '').trim()

      expect(isFormattedNumber(footerIn)).toBeTruthy()
      expect(isFormattedNumber(footerOut)).toBeTruthy()
      expect(isFormattedNumber(footerCache)).toBeTruthy()
      expect(/^\d+\.(\d{2})$/.test(footerCost)).toBeTruthy()
      expect(isFormattedTime(footerTime)).toBeTruthy()
    })

    test('rows should exist and have expected cells', async ({ issuesTable }) => {
      const rows = await issuesTable.getAllRows()
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) {
        await expect(row.descriptionCell).toBeVisible()
        await expect(row.timestampCell).toBeVisible()
        await expect(row.totalTimeCell).toBeVisible()
        await expect(row.statusCell).toBeVisible()
        await expect(row.assistantProvidersCell).toBeVisible()

        // Metrics cells visible when metrics are present
        await expect(row.inputTokensCell).toBeVisible()
        await expect(row.outputTokensCell).toBeVisible()
        await expect(row.cacheTokensCell).toBeVisible()
        await expect(row.costCell).toBeVisible()

        // Checkbox is present for compare
        expect(await row.hasCheckbox()).toBeTruthy()
      }
    })

    test('rows should be ordered by newest first (descending timestamp)', async ({ issuesTable }) => {
      const rows = await issuesTable.getAllRows()
      const timestamps: number[] = []
      for (const row of rows) {
        const text = await row.getTimestampText()
        const date = Date.parse(text) // locale string; Date.parse should work consistently with ISO-like strings
        timestamps.push(date)
      }
      // verify non-increasing order
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1])
      }
    })
  })
})
