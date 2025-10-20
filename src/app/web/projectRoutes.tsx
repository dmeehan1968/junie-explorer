import { Html } from "@kitajs/html"
import express from 'express'
import { AppBody } from "../../components/appBody.js"
import { AppHead } from "../../components/appHead.js"
import { AppHeader } from "../../components/appHeader.js"
import { Breadcrumb } from '../../components/breadcrumb.js'
import { IssueCostChart } from "../../components/issueCostChart.js"
import { HtmlPage } from "../../components/htmlPage.js"
import { IssuesTable } from "../../components/issuesTable.js"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatsButton } from '../../components/statsButton.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { Project } from "../../Project.js"
import { escapeHtml } from "../../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest.js"
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

router.use('/project/:projectId', entityLookupMiddleware)

// IDE Icons Component
const IdeIcons = ({ project, jetBrains }: { project: Project, jetBrains: any }) => (
  <div class="flex gap-2 mb-5" data-testid="ide-icons">
    {project.ideNames.map(ide => (
      <img 
        src={jetBrains.getIDEIcon(ide)} 
        alt={ide} 
        title={ide} 
        class="w-8 h-8"
      />
    ))}
  </div>
)

// Project issues page route
export const projectRouteHandler = async (req: AppRequest, res: AppResponse) => {
  const locale = getLocaleFromRequest(req)
  
  try {
    const { jetBrains, project } = req

    if (!jetBrains || !project) {
      return res.status(404).send('Project not found')
    }

    const page = <HtmlPage cookies={req.cookies}>
      <AppHead title={`${project.name} Issues`}>
        <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/issueCostChart.js"></script>
        <script src="/js/compareModal.js"></script>
      </AppHead>
      <AppBody data-project-id={escapeHtml(project.name ?? '')}>
        <AppHeader actions={[<ThemeSwitcher />, <StatsButton />, <ReloadButton />]} title={project.name} />
        <VersionBanner version={jetBrains.version}/>
        <Breadcrumb
          items={[
            { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
            { label: project.name ?? '', testId: 'breadcrumb-project-name' }
          ]}
        />
        <IdeIcons project={project} jetBrains={jetBrains} />
        <IssueCostChart condition={project.hasMetrics} />
        <IssuesTable project={project} locale={locale} />
      </AppBody>
    </HtmlPage>

    res.send(await page)
  } catch (error) {
    console.error('Error generating issues page:', error)
    res.status(500).send('An error occurred while generating the issues page')
  }
}

router.get('/project/:projectId', projectRouteHandler)

export default router
