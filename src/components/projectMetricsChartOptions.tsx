import { Component, Html } from "@kitajs/html"

export const ProjectMetricsChartOptions: Component = () => {
  return (
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-6" id="project-chart-display">
      <div class="flex gap-2 items-center">
        <div class="">Show:</div>
        <div class="join">
          <input class="join-item btn btn-sm" type="radio" id="display-cost" value="cost" name="display-option"
                 aria-label="Cost" onchange="handleDisplayOptionChange(this)" checked/>
          <input class="join-item btn btn-sm" type="radio" id="display-tokens" value="tokens" name="display-option"
                 aria-label="Tokens" onchange="handleDisplayOptionChange(this)"/>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <div class="">Group:</div>
        <div class="join">
          <input class="join-item btn btn-sm" type="radio" id="group-auto" value="auto" name="group-option"
                 aria-label="Auto" onchange="handleGroupOptionChange(this)" checked/>
          <input class="join-item btn btn-sm" type="radio" id="group-hour" value="hour" name="group-option"
                 aria-label="Hour" onchange="handleGroupOptionChange(this)"/>
          <input class="join-item btn btn-sm" type="radio" id="group-day" value="day" name="group-option"
                 aria-label="Day" onchange="handleGroupOptionChange(this)"/>
          <input class="join-item btn btn-sm" type="radio" id="group-week" value="week" name="group-option"
                 aria-label="Week" onchange="handleGroupOptionChange(this)"/>
          <input class="join-item btn btn-sm" type="radio" id="group-month" value="month" name="group-option"
                 aria-label="Month" onchange="handleGroupOptionChange(this)"/>
        </div>
      </div>
    </div>
  )
}