/** @jsxImportSource @kitajs/html */

import { Tool } from "../schema/tools.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import type { Component } from "@kitajs/html"

export const ToolDecorator: Component<{ tool: Tool }> = ({ tool }) => {
  return (
    <div class="flex flex-col gap-2 p-4 bg-base-content/10 rounded mt-4 mb-8 relative">
      <div class="absolute -top-4 left-4 py-2">
        <span class="bg-secondary text-secondary-content p-2 rounded shadow">{tool.name}</span>
      </div>
      <div class="flex flex-row pt-2">
        <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">Description</div>
        <div class="flex-grow p-2 bg-base-content/10 rounded">{escapeHtml(tool.description?.trim() ?? '')}</div>
      </div>
      {Object.entries(tool.parameters).length > 0 && (
        <div class="w-32 pr-2 text-base-content/50 italic text-right">Parameters</div>
      )}
      {Object.entries(tool.parameters).map(([name, { description, type, ...param }]) => (
        <div class="flex flex-row">
          <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">{name}</div>
          <div class="flex flex-row flex-grow gap-2">
            <div class="flex-grow bg-base-content/10 p-2 rounded">
              {escapeHtml(description ? String(description) : JSON.stringify(param, null, 2))}
            </div>
            <div
              class="flex-shrink-0 bg-base-content/10 text-base-content/50 p-2 rounded">{type ? String(type) : JSON.stringify(param.anyOf)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}