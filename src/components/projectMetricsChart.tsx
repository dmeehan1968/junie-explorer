import { Component, Html } from "@kitajs/html"
import { ProjectMetricsChartOptions } from "./projectMetricsChartOptions.js"

export const ProjectMetricsChart: Component = () => {
  return (
    <div class="card bg-base-100 border border-base-300 shadow mb-5">
      <div class="card-body p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="card-title">Project Metrics</h2>
          <ProjectMetricsChartOptions />
        </div>
        <div id="projects-graph-container" class="h-96 p-2 bg-base-200 rounded-lg hidden">
          <canvas id="projectsMetricsChart"></canvas>
        </div>
      </div>
    </div>)
}