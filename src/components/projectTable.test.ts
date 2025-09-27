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
})