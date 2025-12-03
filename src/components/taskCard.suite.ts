import { expect } from "../playwright/test-utils"
import { test } from "./taskCard.dsl"

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
          await expect(taskCard.trajectoriesTab).toHaveClass(/tab-active/)
          await expect(taskCard.eventsTab).not.toHaveClass(/tab-active/)

          // active/inactive background distinction
          await expect(taskCard.trajectoriesTab).toHaveClass(/bg-base-200/)
          await expect(taskCard.eventsTab).toHaveClass(/bg-base-100/)

          // tabs should share the card border style and radius
          await expect(taskCard.trajectoriesTab).toHaveClass(/border-base-300/)
          await expect(taskCard.eventsTab).toHaveClass(/border-base-300/)
          await expect(taskCard.trajectoriesTab).toHaveClass(/rounded-t-xl/)
          await expect(taskCard.eventsTab).toHaveClass(/rounded-t-xl/)

          // active tab should visually blend into the card by removing the bottom border
          await expect(taskCard.trajectoriesTab).toHaveClass(/border-b-0/)
          await expect(taskCard.eventsTab).not.toHaveClass(/border-b-0/)
        } else {
          await expect(taskCard.eventsTab).toHaveClass(/tab-active/)
          await expect(taskCard.trajectoriesTab).not.toHaveClass(/tab-active/)

          // active/inactive background distinction
          await expect(taskCard.eventsTab).toHaveClass(/bg-base-200/)
          await expect(taskCard.trajectoriesTab).toHaveClass(/bg-base-100/)

          // tabs should share the card border style and radius
          await expect(taskCard.eventsTab).toHaveClass(/border-base-300/)
          await expect(taskCard.trajectoriesTab).toHaveClass(/border-base-300/)
          await expect(taskCard.eventsTab).toHaveClass(/rounded-t-xl/)
          await expect(taskCard.trajectoriesTab).toHaveClass(/rounded-t-xl/)

          // active tab should visually blend into the card by removing the bottom border
          await expect(taskCard.eventsTab).toHaveClass(/border-b-0/)
          await expect(taskCard.trajectoriesTab).not.toHaveClass(/border-b-0/)
        }
      })

      test("tabs have correct navigation URLs in onclick", async ({ taskCard }) => {
        await expect(taskCard.trajectoriesTab).toHaveAttribute('onclick', `window.location.href = '/${base}/trajectories'`)
        await expect(taskCard.eventsTab).toHaveAttribute('onclick', `window.location.href = '/${base}/events'`)
      })

      test("tabs are rendered as top-attached header before the card", async ({ taskCard, page }) => {
        const tabGroup = taskCard.tabGroup
        const card = taskCard.card

        await expect(tabGroup).toBeVisible()
        await expect(card).toBeVisible()

        const tabGroupBox = await tabGroup.boundingBox()
        const cardBox = await card.boundingBox()

        expect(tabGroupBox && cardBox && tabGroupBox.y).toBeLessThan(cardBox!.y)
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

      test("description is initially constrained in height with overflow and has a toggle control", async ({ taskCard, page }) => {
        const description = taskCard.description

        await expect(description).toBeVisible()

        // Should use a max-height utility around 200px and hide overflow by default
        await expect(description).toHaveClass(/max-h-\[200px\]/)
        await expect(description).toHaveClass(/overflow-auto/)

        // Toggle should be present so users can expand/collapse long content
        const toggle = page.getByTestId('task-description-toggle')
        await expect(toggle).toBeAttached()
      })
    })
  })
}
