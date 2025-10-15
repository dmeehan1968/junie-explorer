import { expect } from "../playwright/test.js"
import { test } from "./taskCard.dsl.js"

export function defineTaskCardSuite({
  name,
  project,
  issue,
  task,
  route,
  checkedTab,
  downloadText,
  downloadSuffix,
}: {
  name: string
  project: string
  issue: string
  task: number
  route: "trajectories" | "events"
  checkedTab: "trajectories" | "events"
  downloadText: string
  downloadSuffix: string
}) {

  const base = `project/${project}/issue/${issue}/task/${task}`
  const webBase = `http://localhost:3000/${base}`
  const apiBase = `api/${base}`

  test.describe(`TaskCard (${name})`, () => {
    test.beforeEach(async ({ taskCard }) => {
      await taskCard.navigateTo(`${webBase}/${route}`)
    })

    test("should render the task card", async ({ taskCard }) => {
      await expect(taskCard.card).toBeVisible()
    })

    test.describe("Header and meta", () => {
      test("should show a non-empty title", async ({ taskCard }) => {
        await expect(taskCard.title).toBeVisible()
        await expect(taskCard.title).toHaveText(/\S/)
      })

      test("should have a download button", async ({ page }) => {
        const downloadLink = page.getByRole('link', { name: downloadText })
        await expect(downloadLink).toBeVisible()
        const href = await downloadLink.getAttribute('href')
        expect(href || '').toContain(`${apiBase}/${downloadSuffix}`)
      })

      test("should show ID and Created labels with values", async ({ taskCard }) => {
        await expect(taskCard.idLabel).toBeVisible()
        await expect(taskCard.idLabel).toHaveText(/ID:\s*\S+/)
        await expect(taskCard.createdLabel).toBeVisible()
        await expect(taskCard.createdLabel).toHaveText(/Created:\s*\S+/)
      })
    })

    test.describe("Tabs", () => {
      test("selected tab matches route", async ({ taskCard }) => {
        await expect(taskCard.tabGroup).toBeVisible()
        await expect(taskCard.trajectoriesTab).toBeVisible()
        await expect(taskCard.eventsTab).toBeVisible()

        if (checkedTab === "trajectories") {
          await expect(taskCard.trajectoriesTab).toBeChecked()
          await expect(taskCard.eventsTab).not.toBeChecked()
        } else {
          await expect(taskCard.eventsTab).toBeChecked()
          await expect(taskCard.trajectoriesTab).not.toBeChecked()
        }
      })

      test("tabs have correct navigation URLs in onclick", async ({ taskCard }) => {
        await expect(taskCard.trajectoriesTab).toHaveAttribute('onclick', `window.location.href = '/${base}/trajectories'`)
        await expect(taskCard.eventsTab).toHaveAttribute('onclick', `window.location.href = '/${base}/events'`)
      })
    })

    test.describe("Metrics", () => {
      test("should render all token, cost, and total time cells", async ({ taskCard }) => {
        await expect(taskCard.metrics).toBeVisible()
        await expect(taskCard.inputTokensCell).toBeVisible()
        await expect(taskCard.outputTokensCell).toBeVisible()
        await expect(taskCard.cacheTokensCell).toBeVisible()
        await expect(taskCard.costCell).toBeVisible()
        await expect(taskCard.totalTimeCell).toBeVisible()

        await expect(taskCard.inputTokensCell).toHaveText(/Input Tokens:\s*\d+/)
        await expect(taskCard.outputTokensCell).toHaveText(/Output Tokens:\s*\d+/)
        await expect(taskCard.cacheTokensCell).toHaveText(/Cache Tokens:\s*\d+/)
        await expect(taskCard.costCell).toHaveText(/Cost:\s*\d+(\.\d{1,4})?/)
        await expect(taskCard.totalTimeCell).toHaveText(/Total Time:\s*\S+/)
      })
    })

    test.describe("Description", () => {
      test("should render a non-empty description", async ({ taskCard }) => {
        await expect(taskCard.description).toBeVisible()
        await expect(taskCard.description).toHaveText(/\S/)
      })
    })

    test.describe("JSON Toggle (client-side)", () => {
      test("should toggle the JSON viewer visibility and button text", async ({ taskCard }) => {
        await expect(taskCard.jsonButton).toBeVisible()
        await expect(taskCard.jsonViewer).toBeHidden()

        await taskCard.jsonButton.click()
        await expect(taskCard.jsonViewer).toBeVisible()
        await expect(taskCard.jsonButton).toHaveText("Hide Raw JSON")

        await taskCard.jsonButton.click()
        await expect(taskCard.jsonViewer).toBeHidden()
        await expect(taskCard.jsonButton).toHaveText("Show Raw JSON")
      })
    })
  })
}
