import { Component, Html } from "@kitajs/html"

export const ProjectMetricsChartOptions: Component = () => {
  return (
    <div class="flex gap-2 items-center" id="project-chart-display">
      <div class="">Show:</div>
      <div class="join">
        <input class="join-item btn btn-sm" type="radio" id="display-cost" value="cost" name="display-option"
               aria-label="Cost" onchange="handleDisplayOptionChange(this)" checked/>
        <input class="join-item btn btn-sm" type="radio" id="display-tokens" value="tokens" name="display-option"
               aria-label="Tokens" onchange="handleDisplayOptionChange(this)"/>
      </div>
    </div>
  )
}