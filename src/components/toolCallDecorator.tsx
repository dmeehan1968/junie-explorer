/** @jsxImportSource @kitajs/html */

import { escapeHtml } from "../utils/escapeHtml.js"
import { CollapseIcon } from "./collapseIcon.js"
import { ExpandIcon } from "./expandIcon.js"
import { ToggleComponent } from "./toggleComponent.js"

export const ToolCallDecorator = ({ klass, testId, tool }: {
  klass: string,
  testId: string,
  tool: { name: string, params: Record<string, any>, label: string }
}) => {
  return (
    <div class="relative ml-48 mb-8" data-testid="tool-call">
      <ToggleComponent
        expandIcon={<ExpandIcon/>}
        collapseIcon={<CollapseIcon/>}
        testId={testId}
      />
      <div class="relative">
        <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow" data-testid="tool-call-label">{tool.label}</h3>
        <div
          class={`${klass} rounded shadow flex flex-col gap-1 pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out`}
          data-testid="tool-call-content"
        >
          <div class="py-2">
            <span class="bg-secondary text-secondary-content p-2 rounded shadow" data-testid="tool-call-name">{tool.name}</span>
          </div>
          {Object.entries(tool.params).map(([key, value]) => (
            <div class="flex flex-row" data-testid="tool-call-param-row" data-param-key={key}>
              <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2" data-testid="tool-call-param-key">{key}:</div>
              <div class="flex-grow bg-info text-info-content p-2 rounded" data-testid="tool-call-param-value">
                {escapeHtml(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}