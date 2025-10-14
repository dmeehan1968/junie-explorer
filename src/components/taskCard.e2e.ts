import { expect } from "../playwright/test.js"
import { test } from "./taskCard.dsl.js"

// Tests target the trajectories view for a specific fixture route
// /project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories

test.describe('TaskCard', async () => {
  test.beforeEach(async ({ taskCard }) => {
    await taskCard.navigateTo()
  })

  test('should render the task card', async ({ taskCard }) => {
    await expect(taskCard.card).toBeVisible()
  })

  test.describe('Header and meta', async () => {
    test('should show a non-empty title', async ({ taskCard }) => {
      await expect(taskCard.title).toBeVisible()
      await expect(taskCard.title).toHaveText(/\S/)
    })

    test('should have a download button', async ({ taskCard }) => {
      await expect(taskCard.downloadButton).toBeVisible()
      await expect(taskCard.downloadButton).toHaveText('Download Trajectories as JSONL')
      const href = await taskCard.downloadButton.getAttribute('href')
      expect(href || '').toContain(
        "/api/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories/download"
      )
    })

    test('should show ID and Created labels with values', async ({ taskCard }) => {
      await expect(taskCard.idLabel).toBeVisible()
      await expect(taskCard.idLabel).toHaveText(/ID:\s*\S+/)
      await expect(taskCard.createdLabel).toBeVisible()
      await expect(taskCard.createdLabel).toHaveText(/Created:\s*\S+/)
    })
  })

  test.describe('Tabs', async () => {
    test('Trajectories is checked on the trajectories route', async ({ taskCard }) => {
      await expect(taskCard.tabGroup).toBeVisible()
      await expect(taskCard.trajectoriesTab).toBeVisible()
      await expect(taskCard.eventsTab).toBeVisible()
      await expect(taskCard.trajectoriesTab).toBeChecked()
      await expect(taskCard.eventsTab).not.toBeChecked()
    })

    test('tabs have correct navigation URLs in onclick', async ({ taskCard, page }) => {
      const trajOnClick = await taskCard.trajectoriesTab.getAttribute('onclick')
      const eventsOnClick = await taskCard.eventsTab.getAttribute('onclick')
      expect(trajOnClick || '').toContain("/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories")
      expect(eventsOnClick || '').toContain("/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/events")
    })
  })

  test.describe('Metrics', async () => {
    test('should render all token, cost, and total time cells', async ({ taskCard }) => {
      await expect(taskCard.metrics).toBeVisible()
      await expect(taskCard.inputTokensCell).toBeVisible()
      await expect(taskCard.outputTokensCell).toBeVisible()
      await expect(taskCard.cacheTokensCell).toBeVisible()
      await expect(taskCard.costCell).toBeVisible()
      await expect(taskCard.totalTimeCell).toBeVisible()

      // Basic format sanity checks (numbers somewhere after the labels)
      await expect(taskCard.inputTokensCell).toHaveText(/Input Tokens:\s*\d+/)
      await expect(taskCard.outputTokensCell).toHaveText(/Output Tokens:\s*\d+/)
      await expect(taskCard.cacheTokensCell).toHaveText(/Cache Tokens:\s*\d+/)
      await expect(taskCard.costCell).toHaveText(/Cost:\s*\d+(\.\d{1,4})?/)
      await expect(taskCard.totalTimeCell).toHaveText(/Total Time:\s*\S+/)
    })
  })

  test.describe('Description', async () => {
    test('should render a non-empty description', async ({ taskCard }) => {
      await expect(taskCard.description).toBeVisible()
      await expect(taskCard.description).toHaveText(/\S/)
    })
  })

  test.describe('JSON Toggle (client-side)', async () => {
    test('should toggle the JSON viewer visibility and button text', async ({ taskCard }) => {
      await expect(taskCard.jsonButton).toBeVisible()
      await expect(taskCard.jsonViewer).toBeHidden()

      // Click to show
      await taskCard.jsonButton.click()
      await expect(taskCard.jsonViewer).toBeVisible()
      await expect(taskCard.jsonButton).toHaveText('Hide Raw JSON')

      // Click to hide
      await taskCard.jsonButton.click()
      await expect(taskCard.jsonViewer).toBeHidden()
      await expect(taskCard.jsonButton).toHaveText('Show Raw JSON')
    })
  })
})
