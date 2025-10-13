/** @jsxImportSource @kitajs/html */
import { Html } from "@kitajs/html"
import { Conditional } from "./conditional.js"

export const ContextSizeSection = ({ showIncludeAllTasks }: { showIncludeAllTasks: boolean }) => {
  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed"
         data-testid="context-size-section">
      <div
        class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200"
        data-testid="context-size-header">
        <h3 class="text-xl font-bold text-primary m-0">Context</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="mb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 flex-wrap justify-between">
              <div id="context-size-provider-filters" class="join flex flex-wrap"></div>
              <div class="flex items-center gap-3 ml-auto">
                {showIncludeAllTasks ? (
                  <label class="label cursor-pointer gap-2">
                    <input id="context-size-all-tasks-toggle" type="checkbox" class="toggle toggle-sm"/>
                    <span class="label-text">Include all tasks in issue</span>
                  </label>
                ) : <></>}
              </div>
            </div>
          </div>
        </div>
        <div class="w-full">
          <canvas id="context-size-chart"
                  class="w-full max-w-full h-96 border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}