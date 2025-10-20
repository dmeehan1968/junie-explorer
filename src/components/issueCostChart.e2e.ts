import { expect } from "@playwright/test"
import { test } from "./issueCostChart.dsl.js"

test.describe("IssueCostChart", () => {

  test.describe('with metrics (default.999999)', () => {

    test.beforeEach(async ({ costChart }) => {
      await costChart.navigateTo('default.999999')
    })

    test('should be visible', async ({ costChart }) => {
      await expect(costChart.element).toBeVisible()
    })

    test('should match snapshot', async ({ costChart }) => {
      await expect(costChart.element).toHaveScreenshot({ animations: "disabled" })
    })
  })

  test.describe('without metrics (no-tasks.999999)', () => {

    test.beforeEach(async ({ costChart }) => {
      await costChart.navigateTo('no-tasks.999999')
    })

    test('should be hidden', async ({ costChart }) => {
      await expect(costChart.element).toBeHidden()
    })
  })

})