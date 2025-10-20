/** @jsxImportSource @kitajs/html */
import { Html } from "@kitajs/html"
import { Conditional } from "./conditional.js"

export const IssueCostChart = ({ condition }: { condition: boolean }) => (
  <Conditional condition={condition}>
    <div class="h-96 mb-5 p-4 bg-base-200 rounded-lg border border-base-300" data-testid="cost-over-time-graph">
      <canvas id="costOverTimeChart"></canvas>
    </div>
  </Conditional>
)