import { Component, Html } from "@kitajs/html"
import { ProjectMetricsChartOptions } from "./projectMetricsChartOptions"

export const ProjectMetricsChart: Component = () => {
  return (
    <div class="card bg-base-100 border border-base-300 shadow mb-5">
      <div class="card-body p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="card-title">Project Metrics</h2>
          <ProjectMetricsChartOptions />
        </div>
        <div id="project-metrics-chart" class="h-96 p-2 bg-base-200 rounded-lg hidden relative">
          <div id="chart-loader" class="absolute inset-0 flex items-center justify-center bg-base-200/50 z-10 hidden">
             <span class="loading loading-spinner loading-lg"></span>
          </div>
          <canvas id="projectsMetricsChart"></canvas>
        </div>
      </div>
    </div>)
}