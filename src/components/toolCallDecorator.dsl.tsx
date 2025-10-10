/** @jsxImportSource @kitajs/html */

import { Page, test as base } from "@playwright/test"
import { wrapHtml } from "../utils/wrapHtml.js"
import { ToolCallDecorator } from "./toolCallDecorator.js"

export { expect } from "@playwright/test"

export type ToolCall = {
  name: string
  params: Record<string, any>
  label: string
}

export type ToolCallDecoratorProps = {
  klass?: string
  testId?: string
  tool?: Partial<ToolCall>
}

const DefaultToolCall: ToolCall = {
  name: 'echo',
  label: 'Tool Call',
  params: {
    text: 'Hello <b>World</b>',
    meta: { nested: true, count: 2 },
    nothing: null,
    undef: undefined
  }
}

const defaultProps: Required<Pick<ToolCallDecoratorProps, 'klass' | 'testId'>> = {
  klass: 'bg-base-content/10',
  testId: 'tool-call-toggle'
}

async function renderWithWrapper(klass: string, testId: string, tool: ToolCall) {
  const body = await <ToolCallDecorator klass={klass} testId={testId} tool={tool}/>
  return wrapHtml(body)
}

export class ToolCallDecoratorDSL {
  private constructor(private readonly page: Page, private props: { klass: string; testId: string; tool: ToolCall }) {}

  static async create(page: Page, props: ToolCallDecoratorProps = {}) {
    const mergedTool: ToolCall = {
      ...DefaultToolCall,
      ...(props.tool ?? {} as any),
      params: { ...DefaultToolCall.params, ...(props.tool?.params ?? {}) }
    }
    const merged = {
      klass: props.klass ?? defaultProps.klass,
      testId: props.testId ?? defaultProps.testId,
      tool: mergedTool
    }
    await page.setContent(await renderWithWrapper(merged.klass, merged.testId, merged.tool))
    await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
    return new ToolCallDecoratorDSL(page, merged)
  }

  async setProps(next: ToolCallDecoratorProps) {
    const nextTool = Object.prototype.hasOwnProperty.call(next, 'tool')
      ? {
          ...this.props.tool,
          ...(next.tool ?? {} as any),
          params: Object.prototype.hasOwnProperty.call(next.tool ?? {}, 'params')
            ? (next.tool!.params as any)
            : this.props.tool.params
        }
      : this.props.tool

    this.props = {
      klass: next.klass ?? this.props.klass,
      testId: next.testId ?? this.props.testId,
      tool: nextTool
    }
    await this.page.setContent(await renderWithWrapper(this.props.klass, this.props.testId, this.props.tool))
    await this.page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })
  }

  // container
  get container() {
    return this.page.getByTestId('tool-call')
  }

  // toggle button
  get toggle() {
    return this.page.getByTestId(this.props.testId)
  }

  // label badge
  get labelBadge() {
    return this.page.getByTestId('tool-call-label')
  }

  // name badge
  get nameBadge() {
    return this.page.getByTestId('tool-call-name')
  }

  // content wrapper
  get content() {
    return this.page.getByTestId('tool-call-content')
  }

  // row by param key
  row(key: string) {
    return this.page.locator('[data-testid="tool-call-param-row"][data-param-key="' + key + '"]')
  }

  keyCell(key: string) {
    return this.row(key).getByTestId('tool-call-param-key')
  }

  valueCell(key: string) {
    return this.row(key).getByTestId('tool-call-param-value')
  }
}

export const test = base.extend<{ toolCall: ToolCallDecoratorDSL }>({
  toolCall: async ({ page }, use) => {
    await use(await ToolCallDecoratorDSL.create(page))
  }
})
