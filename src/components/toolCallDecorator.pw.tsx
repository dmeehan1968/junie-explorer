/** @jsxImportSource @kitajs/html */

import { test, expect } from './toolCallDecorator.dsl.js'

// Group tests by feature/prop

test.describe('ToolCallDecorator (component)', () => {
  test('renders tool label and name badges', async ({ toolCall }) => {
    await expect(toolCall.labelBadge).toBeVisible()
    await expect(toolCall.labelBadge).toHaveText('Tool Call')

    await expect(toolCall.nameBadge).toBeVisible()
    await expect(toolCall.nameBadge).toHaveText('echo')

    await toolCall.setProps({ tool: { label: 'Run', name: 'grep', params: {} } })
    await expect(toolCall.labelBadge).toHaveText('Run')
    await expect(toolCall.nameBadge).toHaveText('grep')
  })

  test('applies klass to content wrapper', async ({ toolCall }) => {
    await expect(toolCall.content).toContainClass('bg-base-content/10')

    await toolCall.setProps({ klass: 'border-2 custom-class' })
    await expect(toolCall.content).toContainClass('custom-class')
  })

  test('passes testId to ToggleComponent', async ({ toolCall }) => {
    await expect(toolCall.toggle).toBeVisible()
    const previous = toolCall.toggle

    await toolCall.setProps({ testId: 'my-toggle' })
    await expect(previous).toHaveCount(0)
    const replacement = toolCall['page'].getByTestId('my-toggle')
    await expect(replacement).toBeVisible()
  })

  test('renders parameter rows for each param with correct key and escaped/JSON value', async ({ toolCall }) => {
    // string value should be escaped (no actual <b> tag interpreted)
    await expect(toolCall.keyCell('text')).toHaveText('text:')
    await expect(toolCall.valueCell('text')).toContainText('Hello <b>World</b>')

    // object value should be pretty JSON
    await expect(toolCall.keyCell('meta')).toHaveText('meta:')
    await expect(toolCall.valueCell('meta')).toContainText('{')
    await expect(toolCall.valueCell('meta')).toContainText('nested')

    // null should render as JSON "null"
    await expect(toolCall.valueCell('nothing')).toHaveText('null')

    // undefined should render as the string 'undefined'
    await expect(toolCall.valueCell('undef')).toHaveText('undefined')
  })

  test('updates when params change and supports empty params', async ({ toolCall }) => {
    await toolCall.setProps({ tool: { params: { a: 1, b: 'two', c: { d: 3 } } as any } })
    await expect(toolCall.row('a')).toBeVisible()
    await expect(toolCall.valueCell('a')).toHaveText('1')
    await expect(toolCall.row('b')).toBeVisible()
    await expect(toolCall.valueCell('b')).toHaveText('two')
    await expect(toolCall.row('c')).toBeVisible()
    await expect(toolCall.valueCell('c')).toContainText('{')

    // Empty params removes all rows
    await toolCall.setProps({ tool: { params: {} as any } })
    await expect(toolCall.container.getByTestId('tool-call-param-row')).toHaveCount(0)
  })

  test('includes app stylesheet in HTML wrapper', async ({ toolCall }) => {
    const link = toolCall['page'].locator('link[rel="stylesheet"][href$="/css/app.css"]')
    await expect(link).toHaveCount(1)
  })
})
