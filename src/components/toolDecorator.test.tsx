/** @jsxImportSource @kitajs/html */

import { test, expect } from './toolDecorator.dsl.js'

// Group tests by feature/prop

test.describe('ToolDecorator (component)', () => {
  test('wraps content in standard HTML body with classes', async ({ page, toolDecorator }) => {
    const bodyClass = await page.locator('body').getAttribute('class')
    expect(bodyClass ?? '').toContain('min-h-screen')
    expect(bodyClass ?? '').toContain('p-8')
  })
  test('renders tool name in the badge', async ({ toolDecorator }) => {
    await expect(toolDecorator.nameBadge).toBeVisible()
    await expect(toolDecorator.nameBadge).toHaveText('MyTool')

    await toolDecorator.setTool({ name: 'AnotherTool' })
    await expect(toolDecorator.nameBadge).toHaveText('AnotherTool')
  })

  test('renders escaped and trimmed description text', async ({ toolDecorator }) => {
    // Default description has whitespace and HTML tags; they should be trimmed and escaped.
    await expect(toolDecorator.descriptionCell).toContainText('A <b>desc</b>')

    // Update description
    await toolDecorator.setTool({ description: ' <i>unsafe</i> & text ' as any })
    await expect(toolDecorator.descriptionCell).toHaveText(' <i>unsafe</i> & text '.trim())
  })

  test('shows the Parameters header only when parameters exist', async ({ toolDecorator }) => {
    // Default has parameters
    await expect(toolDecorator.parametersHeader).toBeVisible()

    // Remove all parameters
    await toolDecorator.setTool({ parameters: {} as any })
    await expect(toolDecorator.parametersHeader).toHaveCount(0)
  })

  test('renders parameter rows with name, description/json, and type/anyOf json', async ({ toolDecorator }) => {
    // paramWithDescAndType: description shown in middle, type in right
    await expect(toolDecorator.nameCell('paramWithDescAndType')).toHaveText(/paramWithDescAndType/)
    await expect(toolDecorator.descriptionParamCell('paramWithDescAndType')).toHaveText('Param description')
    await expect(toolDecorator.typeCell('paramWithDescAndType')).toHaveText('string')

    // paramWithAnyOfNoDesc: middle shows JSON (contains anyOf), right shows JSON(anyOf)
    await expect(toolDecorator.nameCell('paramWithAnyOfNoDesc')).toBeVisible()
    await expect(toolDecorator.descriptionParamCell('paramWithAnyOfNoDesc')).toContainText('anyOf')
    await expect(toolDecorator.typeCell('paramWithAnyOfNoDesc')).toContainText('[')

    // paramWithDescNoType: middle shows provided description; right shows JSON(anyOf)
    await expect(toolDecorator.descriptionParamCell('paramWithDescNoType')).toHaveText('Has desc only')
    await expect(toolDecorator.typeCell('paramWithDescNoType')).toContainText('[')
  })
})
