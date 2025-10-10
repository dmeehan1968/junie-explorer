/** @jsxImportSource @kitajs/html */

import { test, expect } from './messageDecorator.dsl.js'

// Group tests by feature/prop

test.describe('MessageDecorator (component)', () => {

  test('renders the toggle button with default testId and with an override', async ({ page, messageDecorator }) => {
    // default
    await expect(messageDecorator.toggle()).toBeVisible()

    // override
    await messageDecorator.setContent({ testId: 'custom-toggle-id' })
    await expect(messageDecorator.toggle('custom-toggle-id')).toBeVisible()
  })

  test('applies margin class based on left prop (mr-48 when left, ml-48 when not left)', async ({ messageDecorator }) => {
    // left = true (default in DSL)
    await expect(messageDecorator.container).toBeVisible()
    await expect(messageDecorator.container).toContainClass('mr-48')
    await expect(messageDecorator.container).not.toContainClass('ml-48')

    // left = false
    await messageDecorator.setContent({ left: false })
    await expect(messageDecorator.container).toContainClass('ml-48')
    await expect(messageDecorator.container).not.toContainClass('mr-48')
  })

  test('includes custom klass in content wrapper class list', async ({ messageDecorator }) => {
    await messageDecorator.setContent({ klass: 'bg-red-500 p-2' })
    const classes = await messageDecorator.contentWrapperClassList()
    expect(classes).toEqual(expect.arrayContaining(['bg-red-500', 'p-2']))
  })

  test('renders label text when provided and empty string when omitted', async ({ messageDecorator }) => {
    await messageDecorator.setContent({ label: 'My Label' })
    await expect(messageDecorator.header).toBeVisible()
    await expect(messageDecorator.header).toHaveText('My Label')

    // Omit label: element remains in DOM but may not be visible. Assert presence and empty text.
    await messageDecorator.setContent({ label: undefined })
    await expect(messageDecorator.header).toHaveCount(1)
    expect(await messageDecorator.headerText()).toBe('')
  })

  test('renders content as string and as JSX element', async ({ messageDecorator }) => {
    // string content
    await messageDecorator.setContent({ content: 'Simple text content' })
    await expect(messageDecorator.contentWrapper).toContainText('Simple text content')

    // JSX content
    await messageDecorator.setContent({ content: <div id="jsx-content"><span>Nested</span> content</div> })
    await expect(messageDecorator.contentWrapper).toContainText('Nested content')
    await expect(messageDecorator.contentWrapper.locator('#jsx-content')).toBeVisible()
  })
})
