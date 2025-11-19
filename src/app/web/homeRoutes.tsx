import { Component } from "@kitajs/html"
import { renderToStream } from "@kitajs/html/suspense"
import express from 'express'
import { AppBody } from "../../components/appBody"
import { AppHead } from "../../components/appHead"
import { AppHeader } from "../../components/appHeader"
import { Conditional } from "../../components/conditional"
import { HtmlPage } from "../../components/htmlPage"
import { IdeSelection } from "../../components/ideSelection"
import { ProjectMetricsChart } from "../../components/projectMetricsChart"
import { ProjectTable } from "../../components/projectTable"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatsButton } from '../../components/statsButton.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { JetBrains } from "../../jetbrains"
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest"
import { AppRequest, AppResponse } from "../types"

const router = express.Router({ mergeParams: true })

const IdeFilters: Component<{ jetBrains: JetBrains }> = async ({ jetBrains }) => {
  const projects = [...(await jetBrains?.projects ?? []).values()]

  // Get all unique IDE names from all projects
  const allIdes = new Set<string>()
  projects.forEach(project => {
    project.ideNames.forEach(ide => allIdes.add(ide))
  })

  // Sort IDE names alphabetically
  const uniqueIdes: string[] = Array.from(allIdes).sort()

  return <IdeSelection ides={uniqueIdes.map(name => ({ name, src: jetBrains!.getIDEIcon(name) }))}/>

}

export const homeRouteHandler = async (req: AppRequest, res: AppResponse) => {
  const locale = getLocaleFromRequest(req)

  try {
    const { jetBrains } = req

    const page = async (rid: number | string) => {
      return (<HtmlPage cookies={req.cookies}>
        <AppHead title={'Junie Explorer'}>
          <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
          <script
            src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
          <script src="/js/themeSwitcher.js"></script>
          <script src="/js/ideFilters.js"></script>
          <script src="/js/projectMetricsChart.js"></script>
        </AppHead>
        <AppBody>
          <AppHeader actions={[<ThemeSwitcher/>, <StatsButton/>, <ReloadButton/>]}/>
          <VersionBanner version={jetBrains?.version}/>
          <p class="mb-5 text-base-content/70" data-testid="logs-directory-path">
            Projects found in: {jetBrains?.logPath || 'Unknown'}
          </p>
          <Conditional condition={!jetBrains!.hasMetrics}>
            <div class="bg-base-content/10 p-4 rounded mb-4">
              The Junie logs do not contain token or cost metrics, which means that the projects were most
              likely created by the Junie General Availability (GA) plugin which does not collect metrics.
            </div>
          </Conditional>
          <Conditional condition={jetBrains!.hasMetrics}>
            <ProjectMetricsChart/>
          </Conditional>

          <IdeFilters jetBrains={jetBrains} />
          <ProjectTable jetBrains={jetBrains!} locale={locale}/>
        </AppBody>
      </HtmlPage>)
    }

    const stream = renderToStream(page)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    stream.pipe(res)

  } catch (error) {
    console.error('Error generating homepage:', error)
    res.status(500).send('An error occurred while generating the homepage')
  }
}

// Homepage route (now shows projects instead of IDEs)
router.get('/', homeRouteHandler)

export default router
