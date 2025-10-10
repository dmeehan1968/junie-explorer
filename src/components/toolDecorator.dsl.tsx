/** @jsxImportSource @kitajs/html */

import { test as base, Page } from "@playwright/test"
export { expect } from "@playwright/test"
import { ToolDecorator } from "./toolDecorator.js"
import type { Tool } from "../schema/tools.js"

export type ToolDecoratorProps = {
  tool: Tool
}

const DefaultTool: Tool = {
  name: 'MyTool',
  description: '  A <b>desc</b>  ',
  ToolType: 'UserTool',
  parameters: {
    paramWithDescAndType: { description: 'Param description', type: 'string' },
    paramWithAnyOfNoDesc: { anyOf: [{ type: 'string' }, { type: 'number' }] },
    paramWithDescNoType: { description: 'Has desc only', anyOf: [{ type: 'object' }] },
  }
}

export class ToolDecoratorDSL {
  private constructor(private readonly page: Page, private tool: Tool) {}

  static async create(page: Page, tool: Partial<Tool> = {}) {
    const merged: Tool = { ...DefaultTool, ...tool, parameters: { ...DefaultTool.parameters, ...(tool.parameters ?? {}) } }
    await page.setContent(await <ToolDecorator tool={merged} />)
    return new ToolDecoratorDSL(page, merged)
  }

  async setTool(tool: Partial<Tool>) {
    const nextParameters = Object.prototype.hasOwnProperty.call(tool, 'parameters')
      ? (tool.parameters as any)
      : this.tool.parameters
    this.tool = { ...this.tool, ...tool, parameters: nextParameters }
    await this.page.setContent(await <ToolDecorator tool={this.tool} />)
  }

  // Root container of the decorator
  get container() {
    return this.page.getByTestId('tool-decorator')
  }

  // Name badge
  get nameBadge() {
    return this.page.getByTestId('tool-name')
  }

  // Description row -> right cell
  get descriptionCell() {
    return this.page.getByTestId('tool-description')
  }

  // Parameters header
  get parametersHeader() {
    return this.page.getByTestId('tool-parameters-header')
  }

  // Parameter row by name using stable test id + attribute
  row(name: string) {
    return this.page.locator('[data-testid="tool-param-row"][data-param-name="' + name + '"]')
  }

  // Left/center/right cells for a given row
  nameCell(name: string) {
    return this.row(name).getByTestId('tool-param-name')
  }

  descriptionParamCell(name: string) {
    return this.row(name).getByTestId('tool-param-desc')
  }

  typeCell(name: string) {
    return this.row(name).getByTestId('tool-param-type')
  }
}

export const test = base.extend<{ toolDecorator: ToolDecoratorDSL }>({
  toolDecorator: async ({ page }, use) => {
    await use(await ToolDecoratorDSL.create(page))
  }
})
