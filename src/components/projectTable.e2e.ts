import { expect } from "../playwright/test"
import { test } from "./projectTable.dsl"

test.describe('ProjectTable', async () => {

  test.beforeEach(async ({ projectTable }) => {
    return projectTable.navigateTo()
  })

  test('should exist', async ({ page, projectTable }) => {
    await expect(projectTable.isVisible).resolves.toEqual(true)
  })

  test('should have one or more projects', async ({ projectTable }) => {
    const rows = await projectTable.getAllRows()
    expect(rows.length).toBeGreaterThan(0)
  })

  test('should find matching projects', async ({ projectTable }) => {
    await projectTable.search('test')
    await expect(projectTable.visibleRowCount).resolves.toBeGreaterThan(0)
  })

  test('row attributes should be set for all rows', async ({ projectTable }) => {
    const rows = await projectTable.getAllRows()
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      await expect(row.element).toHaveAttribute('data-testid', 'project-item')
      await expect(row.element).toHaveAttribute('data-ides', /\[.*]/)
    }
  })

  test.describe('Select column', async () => {

    test('should have a select all checkbox', async ({ projectTable }) => {
      await expect(projectTable.selectAllButton).toBeVisible()
    })

    test('checkbox (when present) should have matching data-project-name for all rows', async ({ projectTable }) => {
      const rows = await projectTable.getAllRows()
      for (const row of rows) {
        await expect(row.nameEl).toHaveTrimmedText(1)
        if (await row.hasCheckbox()) {
          await expect(row.checkbox).toHaveAttribute('data-project-name', await row.getNameText())
        }
      }
    })

  })

  test.describe('Name column', async () => {

    test('should be visible', async ({ projectTable }) => {
      await expect(projectTable.nameColumn).toBeVisible()
    })

    test('should have a sort icon', async ({ projectTable }) => {
      await expect(projectTable.nameColumn.locator('#sort-name-btn')).toBeVisible()
    })

    test('should have a search input', async ({ projectTable }) => {
      await expect(projectTable.searchInput).toBeVisible()
    })

    test('all names should be visible and non-empty', async ({ projectTable }) => {
      const rows = await projectTable.getAllRows()
      for (const row of rows) {
        await expect(row.nameEl).toHaveTrimmedText(1)
      }
    })

    test('each row should contain a link to the project route', async ({ projectTable }) => {
      const rows = await projectTable.getAllRows()
      for (const row of rows) {
        const nameText = await row.getNameText()
        const expectedHref = `/project/${encodeURIComponent(nameText)}`
        if (await row.hasAnchor()) {
          await expect(row.projectAnchor).toHaveAttribute('href', expectedHref)
        } else {
          await expect(row.nameCell).toHaveAttribute('role', 'link')
          const onclick = (await row.getNameCellOnclick()) || ''
          expect(onclick).toContain(expectedHref)
        }
      }
    })

  })

  test.describe('Last updated column', async () => {

    test('should have a last updated column', async ({ projectTable }) => {
      await expect(projectTable.lastUpdatedColumn).toBeVisible()
    })

    test('should have a sort icon in the last updated column', async ({ projectTable }) => {
      await expect(projectTable.lastUpdatedColumn.locator('#sort-updated-btn')).toBeVisible()
    })

    test('each cell should have numeric data-updated-ts and non-empty text', async ({ projectTable }) => {
      const rows = await projectTable.getAllRows()
      for (const row of rows) {
        await expect(row.updatedCell).toHaveAttribute('data-updated-ts', /^(0|[1-9]\d*)$/)
        await expect(row.updatedCell).toHaveTrimmedText()
      }
    })

  })

  test.describe('Issue count column', async () => {

    test('should be visible', async ({ projectTable }) => {
      await expect(projectTable.issueCountColumn).toBeVisible()
    })

    test('each cell should be a non-negative integer', async ({ projectTable }) => {
      const rows = await projectTable.getAllRows()
      for (const row of rows) {
        const issuesText = await row.getIssuesText()
        expect(issuesText).toMatch(/^\d+$/)
      }
    })

  })

  test.describe('LLM icon column', async () => {

    test('should be visible', async ({ projectTable }) => {
      await expect(projectTable.llmIconColumn).toBeVisible()
    })

    test('each cell should be "-" or have one or more icons', async ({ projectTable }) => {
      const rows = await projectTable.getAllRows()
      for (const row of rows) {
        const llmText = ((await row.llmCell.textContent()) || '').trim()
        expect((llmText === '-') || (await row.llmIcons.count()) > 0).toBeTruthy()
      }
    })

  })

  test.describe('IDE icon column', async () => {

    test('should be visible', async ({ projectTable }) => {
      await expect(projectTable.ideIconColumn).toBeVisible()
    })

    test('each row should have one or more IDE icons', async ({ projectTable }) => {
      const rows = await projectTable.getAllRows()
      for (const row of rows) {
        expect(await row.ideIcons.count()).toBeGreaterThan(0)
      }
    })

  })

})