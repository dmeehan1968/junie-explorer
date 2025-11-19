import { renderToStream } from "@kitajs/html/suspense"
import express from 'express'
import { AppBody } from "../../components/appBody"
import { AppHead } from "../../components/appHead"
import { AppHeader } from "../../components/appHeader"
import { HtmlPage } from "../../components/htmlPage"
import { ReloadButton } from '../../components/reloadButton.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { MemorySection } from "../../components/memorySection"
import { FileIOSection } from "../../components/fileIOSection"
import { WorkersSection } from "../../components/workersSection"
import { AppRequest, AppResponse } from "../types"

const router = express.Router({ mergeParams: true })

export const statsRouteHandler = async (req: AppRequest, res: AppResponse) => {
  try {
    const page = async (rid: number | string) => <HtmlPage cookies={req.cookies}>
      <AppHead title={'System Statistics - Junie Explorer'}>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/statsPage.js"></script>
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
              
              <button id="refreshStats" class="btn btn-primary mt-6">
                Refresh
              </button>
            </div>
          </div>

          {/* Memory Row */}
          <MemorySection />

          {/* File I/O Row */}
          <FileIOSection />

          {/* Workers Row */}
          <WorkersSection />
        </div>
      </AppBody>
    </HtmlPage>

    renderToStream(page).pipe(res)
  } catch (error) {
    console.error('Error in stats route:', error)
    res.status(500).send('Internal Server Error')
  }
}

router.get('/stats', statsRouteHandler)

export default router