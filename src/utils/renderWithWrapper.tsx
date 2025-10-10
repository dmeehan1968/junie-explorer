import { ToolCall } from "../components/toolCallDecorator.dsl.js"
import { ToolCallDecorator } from "../components/toolCallDecorator.js"
import { wrapHtml } from "./wrapHtml.js"

export async function renderWithWrapper(klass: string, testId: string, tool: ToolCall) {
  const body = await <ToolCallDecorator klass={klass} testId={testId} tool={tool}/>
  return wrapHtml(body)
}