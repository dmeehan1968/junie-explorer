import { expect } from "playwright/test"
import { test } from "./issuesTable.dsl.js"

test.describe('IssuesTable', async () => {

  test.describe('with issues (default.999999)', async () => {

    test.beforeEach(async ({ issuesTable }) => {
      return issuesTable.navigateTo('default.999999')
    })

    test('should exist', async ({ issuesTable }) => {
      await expect(issuesTable.isVisible).resolves.toEqual(true)
    })

    test('should have one or more issues', async ({ issuesTable }) => {
      const rows = await issuesTable.getAllRows()
      expect(rows.length).toBeGreaterThan(0)
    })

    test('should not show no issues message', async ({ issuesTable }) => {
      await expect(issuesTable.noIssuesMessage).toBeHidden()
    })

    test('should display issues count header', async ({ issuesTable }) => {
      await expect(issuesTable.issuesCountHeader).toBeVisible()
      const headerText = await issuesTable.issuesCountHeader.textContent()
      expect(headerText).toMatch(/\d+ Project Issue/)
    })

    test('should display elapsed time header', async ({ issuesTable }) => {
      await expect(issuesTable.elapsedTimeHeader).toBeVisible()
      const timeText = await issuesTable.elapsedTimeHeader.textContent()
      expect(timeText).toMatch(/Elapsed Time:/)
    })

    test.describe('Select column', async () => {

      test('should have a select all checkbox', async ({ issuesTable }) => {
        await expect(issuesTable.hasSelectAllCheckbox()).resolves.toEqual(true)
        await expect(issuesTable.selectAllCheckbox).toBeVisible()
      })

      test('should have a compare button', async ({ issuesTable }) => {
        await expect(issuesTable.compareButton).toBeVisible()
      })

      test('compare button should be disabled initially', async ({ issuesTable }) => {
        await expect(issuesTable.isCompareButtonEnabled()).resolves.toEqual(false)
      })

      test('checkbox should have matching data-issue-id and data-issue-name for all rows', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          if (await row.hasCheckbox()) {
            const issueId = await row.getCheckboxIssueId()
            const issueName = await row.getCheckboxIssueName()
            expect(issueId).toBeTruthy()
            expect(issueName).toBeTruthy()
            expect(issueId?.length).toBeGreaterThan(0)
            expect(issueName?.length).toBeGreaterThan(0)
          }
        }
      })

    })

    test.describe('Issue Description column', async () => {

      test('should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.descriptionColumnHeader).toBeVisible()
      })

      test('all descriptions should be visible and non-empty', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.descriptionCell).toBeVisible()
          const descText = await row.getDescriptionText()
          expect(descText.length).toBeGreaterThan(0)
        }
      })

      test('each row should have onclick handler for navigation', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          const hasOnclick = await row.hasOnclickHandler()
          expect(hasOnclick).toBeTruthy()
        }
      })

    })

    test.describe('Timestamp column', async () => {

      test('should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.timestampColumnHeader).toBeVisible()
      })

      test('all timestamps should be visible and non-empty', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.timestampCell).toBeVisible()
          const timestampText = await row.getTimestampText()
          expect(timestampText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2}/)
        }
      })

    })

    test.describe('Metric columns (with metrics)', async () => {

      test('Input Tokens column should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.inputTokensColumnHeader).toBeVisible()
      })

      test('Output Tokens column should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.outputTokensColumnHeader).toBeVisible()
      })

      test('Cache Tokens column should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.cacheTokensColumnHeader).toBeVisible()
      })

      test('Cost column should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.costColumnHeader).toBeVisible()
      })

      test('all input tokens should be visible and non-empty', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.inputTokensCell).toBeVisible()
          const tokensText = await row.getInputTokensText()
          expect(tokensText.length).toBeGreaterThan(0)
        }
      })

      test('all output tokens should be visible and non-empty', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.outputTokensCell).toBeVisible()
          const tokensText = await row.getOutputTokensText()
          expect(tokensText.length).toBeGreaterThan(0)
        }
      })

      test('all cache tokens should be visible and non-empty', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.cacheTokensCell).toBeVisible()
          const tokensText = await row.getCacheTokensText()
          expect(tokensText.length).toBeGreaterThan(0)
        }
      })

      test('all costs should be visible and non-empty', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.costCell).toBeVisible()
          const costText = await row.getCostText()
          expect(costText.length).toBeGreaterThan(0)
        }
      })

    })

    test.describe('Time column', async () => {

      test('should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.timeColumnHeader).toBeVisible()
      })

      test('all times should be visible and non-empty', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.totalTimeCell).toBeVisible()
          const timeText = await row.getTotalTimeText()
          expect(timeText.length).toBeGreaterThan(0)
        }
      })

    })

    test.describe('Status column', async () => {

      test('should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.statusColumnHeader).toBeVisible()
      })

      test('all statuses should be visible and have a badge', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.statusCell).toBeVisible()
          await expect(row.statusBadge).toBeVisible()
          const statusText = await row.getStatusText()
          expect(statusText.length).toBeGreaterThan(0)
        }
      })

    })

    test.describe('LLM column', async () => {

      test('should be visible', async ({ issuesTable }) => {
        await expect(issuesTable.llmColumnHeader).toBeVisible()
      })

      test('each cell should be "-" or have one or more icons', async ({ issuesTable }) => {
        const rows = await issuesTable.getAllRows()
        for (const row of rows) {
          await expect(row.assistantProvidersCell).toBeVisible()
          const llmText = await row.getAssistantProvidersText()
          expect((llmText === '-') || (await row.assistantProviderIcons.count()) > 0).toBeTruthy()
        }
      })

    })

    test.describe('Header summary row', async () => {

      test('should have summary label', async ({ issuesTable }) => {
        await expect(issuesTable.headerSummaryLabel).toBeVisible()
        const labelText = await issuesTable.headerSummaryLabel.textContent()
        expect(labelText).toContain('Project Summary')
      })

      test('should have input tokens summary', async ({ issuesTable }) => {
        await expect(issuesTable.headerSummaryInputTokens).toBeVisible()
        const tokensText = await issuesTable.headerSummaryInputTokens.textContent()
        expect(tokensText?.trim().length).toBeGreaterThan(0)
      })

      test('should have output tokens summary', async ({ issuesTable }) => {
        await expect(issuesTable.headerSummaryOutputTokens).toBeVisible()
        const tokensText = await issuesTable.headerSummaryOutputTokens.textContent()
        expect(tokensText?.trim().length).toBeGreaterThan(0)
      })

      test('should have cache tokens summary', async ({ issuesTable }) => {
        await expect(issuesTable.headerSummaryCacheTokens).toBeVisible()
        const tokensText = await issuesTable.headerSummaryCacheTokens.textContent()
        expect(tokensText?.trim().length).toBeGreaterThan(0)
      })

      test('should have cost summary', async ({ issuesTable }) => {
        await expect(issuesTable.headerSummaryCost).toBeVisible()
        const costText = await issuesTable.headerSummaryCost.textContent()
        expect(costText?.trim().length).toBeGreaterThan(0)
      })

      test('should have total time summary', async ({ issuesTable }) => {
        await expect(issuesTable.headerSummaryTotalTime).toBeVisible()
        const timeText = await issuesTable.headerSummaryTotalTime.textContent()
        expect(timeText?.trim().length).toBeGreaterThan(0)
      })

    })

    test.describe('Footer summary row', async () => {

      test('should have summary label', async ({ issuesTable }) => {
        await expect(issuesTable.footerSummaryLabel).toBeVisible()
        const labelText = await issuesTable.footerSummaryLabel.textContent()
        expect(labelText).toContain('Project Summary')
      })

      test('should have input tokens summary', async ({ issuesTable }) => {
        await expect(issuesTable.footerSummaryInputTokens).toBeVisible()
        const tokensText = await issuesTable.footerSummaryInputTokens.textContent()
        expect(tokensText?.trim().length).toBeGreaterThan(0)
      })

      test('should have output tokens summary', async ({ issuesTable }) => {
        await expect(issuesTable.footerSummaryOutputTokens).toBeVisible()
        const tokensText = await issuesTable.footerSummaryOutputTokens.textContent()
        expect(tokensText?.trim().length).toBeGreaterThan(0)
      })

      test('should have cache tokens summary', async ({ issuesTable }) => {
        await expect(issuesTable.footerSummaryCacheTokens).toBeVisible()
        const tokensText = await issuesTable.footerSummaryCacheTokens.textContent()
        expect(tokensText?.trim().length).toBeGreaterThan(0)
      })

      test('should have cost summary', async ({ issuesTable }) => {
        await expect(issuesTable.footerSummaryCost).toBeVisible()
        const costText = await issuesTable.footerSummaryCost.textContent()
        expect(costText?.trim().length).toBeGreaterThan(0)
      })

      test('should have total time summary', async ({ issuesTable }) => {
        await expect(issuesTable.footerSummaryTotalTime).toBeVisible()
        const timeText = await issuesTable.footerSummaryTotalTime.textContent()
        expect(timeText?.trim().length).toBeGreaterThan(0)
      })

    })

  })

  test.describe('without issues (no-issues.999999)', async () => {

    test.beforeEach(async ({ issuesTable }) => {
      return issuesTable.navigateTo('no-issues.999999')
    })

    test('should show no issues message', async ({ issuesTable }) => {
      await expect(issuesTable.noIssuesMessage).toBeVisible()
    })

    test('should not show issues table', async ({ issuesTable }) => {
      await expect(issuesTable.isVisible).resolves.toEqual(false)
    })

    test('no issues message should have correct text', async ({ issuesTable }) => {
      const messageText = await issuesTable.noIssuesMessage.textContent()
      expect(messageText).toContain('No issues found for this project')
    })

  })

  test.describe('without metrics (no-tasks.999999)', async () => {

    test.beforeEach(async ({ issuesTable }) => {
      return issuesTable.navigateTo('no-tasks.999999')
    })

    test('should show no metrics warning', async ({ issuesTable }) => {
      await expect(issuesTable.hasNoMetricsWarning()).resolves.toEqual(true)
      await expect(issuesTable.noMetricsWarning).toBeVisible()
    })

    test('should not have select all checkbox', async ({ issuesTable }) => {
      await expect(issuesTable.hasSelectAllCheckbox()).resolves.toEqual(false)
    })

    test('should not have compare button', async ({ issuesTable }) => {
      await expect(issuesTable.compareButton.isVisible()).resolves.toEqual(false)
    })

    test('should not have metric column headers', async ({ issuesTable }) => {
      await expect(issuesTable.inputTokensColumnHeader.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.outputTokensColumnHeader.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.cacheTokensColumnHeader.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.costColumnHeader.isVisible()).resolves.toEqual(false)
    })

    test('should have non-metric column headers', async ({ issuesTable }) => {
      await expect(issuesTable.timeColumnHeader).toBeVisible()
      await expect(issuesTable.statusColumnHeader).toBeVisible()
      await expect(issuesTable.llmColumnHeader).toBeVisible()
    })

    test('rows should not have checkboxes', async ({ issuesTable }) => {
      const rows = await issuesTable.getAllRows()
      if (rows.length > 0) {
        for (const row of rows) {
          await expect(row.hasCheckbox()).resolves.toEqual(false)
        }
      }
    })

    test('rows should not have metric cells', async ({ issuesTable }) => {
      const rows = await issuesTable.getAllRows()
      if (rows.length > 0) {
        for (const row of rows) {
          await expect(row.inputTokensCell.isVisible()).resolves.toEqual(false)
          await expect(row.outputTokensCell.isVisible()).resolves.toEqual(false)
          await expect(row.cacheTokensCell.isVisible()).resolves.toEqual(false)
          await expect(row.costCell.isVisible()).resolves.toEqual(false)
        }
      }
    })

    test('should not have header summary metric cells', async ({ issuesTable }) => {
      await expect(issuesTable.headerSummaryInputTokens.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.headerSummaryOutputTokens.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.headerSummaryCacheTokens.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.headerSummaryCost.isVisible()).resolves.toEqual(false)
    })

    test('should not have footer summary metric cells', async ({ issuesTable }) => {
      await expect(issuesTable.footerSummaryInputTokens.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.footerSummaryOutputTokens.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.footerSummaryCacheTokens.isVisible()).resolves.toEqual(false)
      await expect(issuesTable.footerSummaryCost.isVisible()).resolves.toEqual(false)
    })

  })

})
