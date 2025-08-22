import { Html } from "@kitajs/html"
import express from 'express'
import { AppBody } from "../../components/appBody.js"
import { AppHead } from "../../components/appHead.js"
import { AppHeader } from "../../components/appHeader.js"
import { Conditional } from "../../components/conditional.js"
import { HtmlPage } from "../../components/htmlPage.js"
import { IdeSelection } from "../../components/ideSelection.js"
import { ProjectMetricsChart } from "../../components/projectMetricsChart.js"
import { ProjectTable } from "../../components/projectTable.js"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatsButton } from '../../components/statsButton.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest.js"
import { jetBrainsPath } from '../../utils/jetBrainsPath.js'
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

export const homeRouteHandler = async (req: AppRequest, res: AppResponse) => {
  const locale = getLocaleFromRequest(req)

  try {
    const { jetBrains } = req
    const projects = [...(await jetBrains?.projects ?? []).values()]

    // Get all unique IDE names from all projects
    const allIdes = new Set<string>()
    projects.forEach(project => {
      project.ideNames.forEach(ide => allIdes.add(ide))
    })

    // Sort IDE names alphabetically
    const uniqueIdes: string[] = Array.from(allIdes).sort()

    const page = <HtmlPage cookies={req.cookies}>
      <AppHead title={'Junie Explorer'}>
        <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
        <script>
          window.projectsData = {JSON.stringify(projects.map(p => ({ name: p.name, ides: p.ideNames })))};
        </script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/ideFilters.js"></script>
        <script src="/js/projectSelection.js"></script>
        <script src="/js/reloadPage.js"></script>
      </AppHead>
      <AppBody>
        <AppHeader actions={[<ThemeSwitcher/>, <StatsButton/>, <ReloadButton/>]}/>
        <VersionBanner version={jetBrains?.version}/>
        <p class="mb-5 text-base-content/70" data-testid="logs-directory-path">
          Projects found in: {jetBrainsPath}
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

        <IdeSelection ides={uniqueIdes.map(name => ({ name, src: jetBrains!.getIDEIcon(name) }))}/>

        <ProjectTable projects={projects} jetBrains={jetBrains!} locale={locale} />
      </AppBody>
    </HtmlPage>

    res.send(await page)

  } catch (error) {
    console.error('Error generating homepage:', error)
    res.status(500).send('An error occurred while generating the homepage')
  }
}

// Homepage route (now shows projects instead of IDEs)
router.get('/', homeRouteHandler)

export default router
