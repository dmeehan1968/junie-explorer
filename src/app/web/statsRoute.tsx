import { Html } from "@kitajs/html"
import express from 'express'
import { AppBody } from "../../components/appBody.js"
import { AppHead } from "../../components/appHead.js"
import { AppHeader } from "../../components/appHeader.js"
import { HtmlPage } from "../../components/htmlPage.js"
import { ReloadButton } from '../../components/reloadButton.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

export const statsRouteHandler = async (req: AppRequest, res: AppResponse) => {
  try {
    const page = <HtmlPage cookies={req.cookies}>
      <AppHead title={'System Statistics - Junie Explorer'}>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/statsPage.js"></script>
        <script src="/js/reloadPage.js"></script>
      </AppHead>
      <AppBody>
        <AppHeader title="System Statistics" actions={[<ThemeSwitcher/>, <ReloadButton/>]}/>
        
        <div class="container mx-auto p-6">
          <div class="mb-6">
            <div class="flex gap-4 mb-4">
              <label class="form-control w-full max-w-xs">
                <div class="label">
                  <span class="label-text">Time Period</span>
                </div>
                <select id="timePeriod" class="select select-bordered">
                  <option value="1m">Last 1 minute</option>
                  <option value="5m">Last 5 minutes</option>
                  <option value="15m">Last 15 minutes</option>
                  <option value="1h" selected>Last 1 hour</option>
                  <option value="6h">Last 6 hours</option>
                  <option value="12h">Last 12 hours</option>
                </select>
              </label>
              
              <button id="refreshStats" class="btn btn-primary mt-8">
                Refresh
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Memory Usage Chart */}
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Memory Usage</h2>
                <div class="h-80">
                  <canvas id="memoryChart"></canvas>
                </div>
              </div>
            </div>

            {/* Worker Pool Metrics Chart */}
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Worker Pool Activity</h2>
                <div class="h-80">
                  <canvas id="workerChart"></canvas>
                </div>
              </div>
            </div>

            {/* Current Stats Summary */}
            <div class="card bg-base-100 shadow-xl lg:col-span-2">
              <div class="card-body">
                <h2 class="card-title">Current Statistics</h2>
                <div id="currentStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="stat">
                    <div class="stat-title">Memory Used (MB)</div>
                    <div class="stat-value text-primary" id="memUsed">-</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Heap Used (MB)</div>
                    <div class="stat-value text-secondary" id="heapUsed">-</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Active Workers</div>
                    <div class="stat-value text-accent" id="activeWorkers">-</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Queued Jobs</div>
                    <div class="stat-value text-info" id="queuedJobs">-</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Success Count</div>
                    <div class="stat-value text-success" id="successCount">-</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Failure Count</div>
                    <div class="stat-value text-error" id="failureCount">-</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Avg Execution (ms)</div>
                    <div class="stat-value text-warning" id="avgExecution">-</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Peak Workers</div>
                    <div class="stat-value text-neutral" id="peakWorkers">-</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </AppBody>
    </HtmlPage>

    res.send(await page)
  } catch (error) {
    console.error('Error in stats route:', error)
    res.status(500).send('Internal Server Error')
  }
}

router.get('/stats', statsRouteHandler)

export default router