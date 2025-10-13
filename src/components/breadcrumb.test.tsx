/** @jsxImportSource @kitajs/html */

import { test, expect } from './breadcrumb.dsl.js'

// Tests grouped by feature/prop per guidelines

test.describe('Breadcrumb', () => {
  test.describe('Navigation container', () => {
    test('renders nav with aria-label and default className', async ({ breadcrumb }) => {
      await breadcrumb.setClassName(undefined)
      await expect(breadcrumb.nav).toBeVisible()
      await expect(breadcrumb.nav).toHaveAttribute('aria-label', 'breadcrumb')
      await expect(breadcrumb.nav).toContainClass('bg-base-200')
      await expect(breadcrumb.nav).toContainClass('mb-5')
    })

    test('applies custom className when provided', async ({ breadcrumb }) => {
      await breadcrumb.setClassName('bg-accent px-2')
      await expect(breadcrumb.nav).toContainClass('bg-accent')
      await expect(breadcrumb.nav).toContainClass('px-2')
    })
  })

  test.describe('Items rendering and order', () => {
    test('renders items in order with correct count', async ({ breadcrumb }) => {
      const items = [
        { label: 'One', href: '/one', testId: 'one' },
        { label: 'Two', href: '/two', testId: 'two' },
        { label: 'Three', testId: 'three' },
      ]
      await breadcrumb.setItems(items)

      await expect(breadcrumb.listItems).toHaveCount(3)
      await expect(breadcrumb.itemByTestId('one')).toContainText('One')
      await expect(breadcrumb.itemByTestId('two')).toContainText('Two')
      await expect(breadcrumb.itemByTestId('three')).toContainText('Three')
    })

    test('renders empty list when items is empty', async ({ breadcrumb }) => {
      await breadcrumb.setItems([])
      await expect(breadcrumb.listItems).toHaveCount(0)
    })
  })

  test.describe('Link vs text behavior', () => {
    test('non-last items with href render as links with classes and href', async ({ breadcrumb }) => {
      const items = [
        { label: 'Home', href: '/', testId: 'home' },
        { label: 'Section', href: '/section', testId: 'section' },
        { label: 'Current', testId: 'current' },
      ]
      await breadcrumb.setItems(items)

      // First item should be a link
      const firstLink = breadcrumb.linkByIndex(0)
      await expect(firstLink).toHaveAttribute('href', '/')
      await expect(firstLink).toContainClass('text-primary')
      await expect(firstLink).toContainClass('hover:text-primary-focus')

      // Second item should be a link
      const secondLink = breadcrumb.linkByIndex(1)
      await expect(secondLink).toHaveAttribute('href', '/section')
      await expect(secondLink).toContainClass('text-primary')

      // Third (last) item should NOT be a link
      await expect(breadcrumb.linkByIndex(2)).toHaveCount(0)
      const thirdItem = breadcrumb.itemByTestId('current')
      await expect(thirdItem).toContainClass('text-base-content/70')
    })

    test('item without href renders as plain text even if not last', async ({ breadcrumb }) => {
      const items = [
        { label: 'Home', testId: 'home' },
        { label: 'Section', href: '/section', testId: 'section' },
        { label: 'Current', testId: 'current' },
      ]
      await breadcrumb.setItems(items)

      // First item has no link, should be plain text
      await expect(breadcrumb.linkByIndex(0)).toHaveCount(0)
      const firstItem = breadcrumb.itemByTestId('home')
      await expect(firstItem).toContainClass('text-base-content/70')

      // Second item has link
      await expect(breadcrumb.linkByIndex(1)).toHaveAttribute('href', '/section')
    })

    test('last item never renders as a link even if href is provided', async ({ breadcrumb }) => {
      const items = [
        { label: 'Home', href: '/', testId: 'home' },
        { label: 'Current', href: '/current', testId: 'current' },
      ]
      await breadcrumb.setItems(items)

      // Last item index 1 should not be a link
      await expect(breadcrumb.linkByIndex(1)).toHaveCount(0)
      const lastItem = breadcrumb.itemByTestId('current')
      await expect(lastItem).toContainClass('text-base-content/70')
    })
  })

  test.describe('data-testid propagation', () => {
    test('applies testId to anchors for link items', async ({ breadcrumb }) => {
      const items = [
        { label: 'Home', href: '/', testId: 'home' },
        { label: 'Section', href: '/section', testId: 'section' },
        { label: 'Current', testId: 'current' },
      ]
      await breadcrumb.setItems(items)

      await expect(breadcrumb.itemByTestId('home')).toBeVisible()
      await expect(breadcrumb.itemByTestId('section')).toBeVisible()

      // Verify they are anchors by checking href on the element with the testId
      await expect(breadcrumb.itemByTestId('home')).toHaveAttribute('href', '/')
      await expect(breadcrumb.itemByTestId('section')).toHaveAttribute('href', '/section')
    })

    test('applies testId to li for non-link items', async ({ breadcrumb }) => {
      const items = [
        { label: 'Home', testId: 'home' },
        { label: 'Current', testId: 'current' },
      ]
      await breadcrumb.setItems(items)

      // Ensure no anchors for these items
      await expect(breadcrumb.itemByTestId('home').locator('a')).toHaveCount(0)
      await expect(breadcrumb.itemByTestId('current').locator('a')).toHaveCount(0)
    })
  })
})
