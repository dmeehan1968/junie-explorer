import { Locator } from "@playwright/test"
import { expect } from "../playwright/test.js"
import { IssueRowDSL } from "./issueRow.dsl.js"
import { test } from "./issuesTable.dsl.js"

test.describe('IssuesTable', async () => {

  test.describe('no-issues project', async () => {
    test.beforeEach(async ({ issuesTable }) => {
      await issuesTable.navigateToProject('no-issues.999999')
    })

    test('should show no issues message and no table', async ({ issuesTable }) => {
      await expect(issuesTable.noIssuesMessage).toBeVisible()
      await expect(issuesTable.table).toBeMissing()
    })
  })

  test.describe('no-tasks project (no metrics)', async () => {
    test.beforeEach(async ({ issuesTable }) => {
      await issuesTable.navigateToProject('no-tasks.999999')
    })

    test('should render table without metrics columns and compare button disabled/hidden', async ({ page, issuesTable }) => {
      await expect(issuesTable.table).toBeVisible()
      // Compare button exists but should be disabled only when metrics present; without metrics, it should not be visible
      await expect(issuesTable.compareButton).toBeMissing()

      // Header summary shows only total time (no metrics)
      await expect(issuesTable.headerSummaryLabel).toHaveText('Project Summary')
      await expect(issuesTable.headerSummaryTotalTime).toBeVisible()
      await expect(issuesTable.headerSummaryInputTokens).toBeMissing()
      await expect(issuesTable.headerSummaryOutputTokens).toBeMissing()
      await expect(issuesTable.headerSummaryCacheTokens).toBeMissing()
      await expect(issuesTable.headerSummaryCost).toBeMissing()

      // Footer summary mirrors header summary
      await expect(issuesTable.footerSummaryLabel).toHaveText('Project Summary')
      await expect(issuesTable.footerSummaryTotalTime).toBeVisible()
      await expect(issuesTable.footerSummaryInputTokens).toBeMissing()
      await expect(issuesTable.footerSummaryOutputTokens).toBeMissing()
      await expect(issuesTable.footerSummaryCacheTokens).toBeMissing()
      await expect(issuesTable.footerSummaryCost).toBeMissing()

      // Elapsed time label visible
      await expect(issuesTable.summaryElapsedTime).toBeVisible()
    })
  })

  test.describe('default project (with metrics and issues)', async () => {
    test.beforeEach(async ({ issuesTable, context }) => {
      await issuesTable.navigateToProject('default.999999')
    })

    test('should render table and compare controls', async ({ issuesTable }) => {
      await expect(issuesTable.table).toBeVisible()
      await expect(issuesTable.compareButton).toBeVisible()
    })

    test('summary header and footer should show numeric metrics and formatted time', async ({ issuesTable }) => {
      await expect(issuesTable.headerSummaryLabel).toHaveText('Project Summary')
      await expect(issuesTable.footerSummaryLabel).toHaveText('Project Summary')

      await expect(issuesTable.headerSummaryInputTokens).toBeFormattedNumber()
      await expect(issuesTable.headerSummaryOutputTokens).toBeFormattedNumber()
      await expect(issuesTable.headerSummaryCacheTokens).toBeFormattedNumber()
      await expect(issuesTable.headerSummaryCost).toBeDecimalNumber(2)
      await expect(issuesTable.headerSummaryTotalTime).toBeFormattedTime()

      await expect(issuesTable.footerSummaryInputTokens).toBeFormattedNumber()
      await expect(issuesTable.footerSummaryOutputTokens).toBeFormattedNumber()
      await expect(issuesTable.footerSummaryCacheTokens).toBeFormattedNumber()
      await expect(issuesTable.footerSummaryCost).toBeDecimalNumber(2)
      await expect(issuesTable.footerSummaryTotalTime).toBeFormattedTime()
    })

    test('rows should exist and have expected cells', async ({ issuesTable }) => {
      const rows = await issuesTable.getAllRows()
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) {
        // Check that expected cells are visible and have onclick handlers to navigate to trajectories
        for(const cell of ["descriptionCell", "timestampCell", "inputTokensCell", "outputTokensCell", "cacheTokensCell", "costCell", "totalTimeCell", "statusCell", "assistantProvidersCell"] as (keyof IssueRowDSL)[]) {
          await expect((row[cell] as Locator)).toBeVisible()
          await expect((row[cell] as Locator).getAttribute('onclick')).resolves.toMatch(/task\/0\/trajectories/)
        }

        // Description cell should contain a link to the trajectories route and non-empty text
        const link = row.descriptionCell.locator('a')
        const linkCount = await link.count()
        if (linkCount > 0) {
          const href = (await link.first().getAttribute('href')) || ''
          expect(href).toMatch(/\/project\/[^/]+\/issue\/[^/]+\/task\/0\/trajectories$/)
        }

        await expect(row.descriptionCell).toHaveTrimmedText(1)
        await expect(row.timestampCell.textContent()).resolves.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M/)
        await expect(row.inputTokensCell).toBeFormattedNumber()
        await expect(row.outputTokensCell).toBeFormattedNumber()
        await expect(row.cacheTokensCell).toBeFormattedNumber()
        await expect(row.costCell).toBeDecimalNumber(4)
        await expect(row.totalTimeCell).toBeFormattedTime()
        await expect(row.statusCell).toHaveTrimmedText(1)
        await expect(row.assistantProvidersCell.getByRole('img')).toHaveCountInRange(1)

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
