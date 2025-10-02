import { expect } from "@playwright/test"
import { test } from "./breadcrumb.dsl.js"

const PROJECT_ID = 'default.999999'
const ISSUE_ID = 'd9210e84-2af4-4e45-a383-cee37492c8e6'
const TASK_ID = '0'

test.describe('Breadcrumb', () => {

  test.describe('Project Page', () => {

    test.beforeEach(async ({ breadcrumb }) => {
      await breadcrumb.navigateTo(`/project/${PROJECT_ID}`)
    })

    test('should be visible', async ({ breadcrumb }) => {
      await expect(breadcrumb.breadcrumbNavigation).toBeVisible()
    })

    test('should have correct number of breadcrumb items', async ({ breadcrumb }) => {
      const count = await breadcrumb.getBreadcrumbItemCount()
      expect(count).toBe(2)
    })

    test('should have correctly formed links', async ({ breadcrumb }) => {
      await test.step('Projects link should be visible and have correct href', async () => {
        const projectsItem = breadcrumb.breadcrumbItem('breadcrumb-projects')
        await expect(projectsItem).toBeVisible()
        const href = await breadcrumb.getBreadcrumbItemHref('breadcrumb-projects')
        expect(href).toBe('/')
      })

      await test.step('Project name should be visible and be the last item', async () => {
        const projectNameItem = breadcrumb.breadcrumbItem('breadcrumb-project-name')
        await expect(projectNameItem).toBeVisible()
        const isLast = await breadcrumb.isLastItem('breadcrumb-project-name')
        expect(isLast).toBe(true)
      })
    })
  })

  test.describe('Task Trajectories Page', () => {
    const url = `/project/${PROJECT_ID}/issue/${ISSUE_ID}/task/${TASK_ID}/trajectories`

    test('should be visible', async ({ breadcrumb }) => {
      await breadcrumb.navigateTo(url)
      await expect(breadcrumb.breadcrumbNavigation).toBeVisible()
    })

    test('should have correct number of breadcrumb items', async ({ breadcrumb }) => {
      await breadcrumb.navigateTo(url)
      const count = await breadcrumb.getBreadcrumbItemCount()
      expect(count).toBe(3)
    })

    test('should have correctly formed links', async ({ breadcrumb }) => {
      await breadcrumb.navigateTo(url)

      await test.step('Projects link should be visible and have correct href', async () => {
        const projectsItem = breadcrumb.breadcrumbItem('breadcrumb-projects')
        await expect(projectsItem).toBeVisible()
        const href = await breadcrumb.getBreadcrumbItemHref('breadcrumb-projects')
        expect(href).toBe('/')
      })

      await test.step('Project name link should be visible and have correct href', async () => {
        const projectNameItem = breadcrumb.breadcrumbItem('breadcrumb-project-name')
        await expect(projectNameItem).toBeVisible()
        const href = await breadcrumb.getBreadcrumbItemHref('breadcrumb-project-name')
        expect(href).toBe(`/project/${encodeURIComponent(PROJECT_ID)}`)
      })

      await test.step('Issue name should be visible and be the last item', async () => {
        const issueNameItem = breadcrumb.breadcrumbItem('breadcrumb-issue-name')
        await expect(issueNameItem).toBeVisible()
        const isLast = await breadcrumb.isLastItem('breadcrumb-issue-name')
        expect(isLast).toBe(true)
      })
    })
  })

  test.describe('Task Events Page', () => {
    test.beforeEach(async ({ breadcrumb }) => {
      await breadcrumb.navigateTo(`/project/${PROJECT_ID}/issue/${ISSUE_ID}/task/${TASK_ID}/events`)
    })

    test('should be visible', async ({ breadcrumb }) => {
      await expect(breadcrumb.breadcrumbNavigation).toBeVisible()
    })

    test('should have correct number of breadcrumb items', async ({ breadcrumb }) => {
      const count = await breadcrumb.getBreadcrumbItemCount()
      expect(count).toBe(3)
    })

    test('should have correctly formed links', async ({ breadcrumb }) => {
      await test.step('Projects link should be visible and have correct href', async () => {
        const projectsItem = breadcrumb.breadcrumbItem('breadcrumb-projects')
        await expect(projectsItem).toBeVisible()
        const href = await breadcrumb.getBreadcrumbItemHref('breadcrumb-projects')
        expect(href).toBe('/')
      })

      await test.step('Project name link should be visible and have correct href', async () => {
        const projectNameItem = breadcrumb.breadcrumbItem('breadcrumb-project-name')
        await expect(projectNameItem).toBeVisible()
        const href = await breadcrumb.getBreadcrumbItemHref('breadcrumb-project-name')
        expect(href).toBe(`/project/${encodeURIComponent(PROJECT_ID)}`)
      })

      await test.step('Issue name should be visible and be the last item', async () => {
        const issueNameItem = breadcrumb.breadcrumbItem('breadcrumb-issue-name')
        await expect(issueNameItem).toBeVisible()
        const isLast = await breadcrumb.isLastItem('breadcrumb-issue-name')
        expect(isLast).toBe(true)
      })
    })
  })

})
