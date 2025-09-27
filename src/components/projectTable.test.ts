import { expect } from "playwright/test"
import { test } from "./projectTable.dsl.js"

test.describe('ProjectTable', async () => {

  test.beforeEach(async ({ projectTable }) => {
    return projectTable.navigateTo()
  })

  test('should exist', async ({ page, projectTable }) => {
    await expect(projectTable.isVisible).resolves.toEqual(true)
  })

  test('should have one or more projects', async ({ projectTable }) => {
    await expect(projectTable.rowCount).resolves.toBeGreaterThan(0)
  })

  test('should find matching projects', async ({ projectTable }) => {
    await projectTable.search('test')
    await expect(projectTable.visibleRowCount).resolves.toBeGreaterThan(0)
  })

  test('should allow selection', async ({ projectTable }) => {
    await projectTable.selectRow(1)
    await expect(projectTable.selectedRowCount).resolves.toEqual(1)
  })

  test('should have a select all checkbox', async ({ projectTable }) => {
    await expect(projectTable.selectAllButton).toBeVisible()
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

  })

  test.describe('Last updated column', async () => {

    test('should have a last updated column', async ({ projectTable }) => {
      await expect(projectTable.lastUpdatedColumn).toBeVisible()
    })

    test('should have a sort icon in the last updated column', async ({ projectTable }) => {
      await expect(projectTable.lastUpdatedColumn.locator('#sort-updated-btn')).toBeVisible()
    })

  })

  test.describe('Issue count column', async () => {

    test('should be visible', async ({ projectTable }) => {
      await expect(projectTable.issueCountColumn).toBeVisible()
    })

  })

  test.describe('LLM icon column', async () => {

    test('should be visible', async ({ projectTable }) => {
      await expect(projectTable.llmIconColumn).toBeVisible()
    })

  })

  test.describe('IDE icon column', async () => {

    test('should be visible', async ({ projectTable }) => {
      await expect(projectTable.ideIconColumn).toBeVisible()
    })

  })

})