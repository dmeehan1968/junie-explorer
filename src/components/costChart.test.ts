import { expect } from "@playwright/test"
import { test } from "./costChart.dsl.js"

test.describe("costChart", () => {

  test.describe('with metrics (default.999999)', () => {

    test.beforeEach(async ({ costChart }) => {
      await costChart.navigateTo('default.999999')
    })

    test('should be visible', async ({ costChart }) => {
      await expect(costChart.element).toBeVisible()
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