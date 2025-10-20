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
import { Issue } from "../../Issue.js"
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

// Function to prepare data for the cost over time graph
async function prepareGraphData(issues: Issue[]): Promise<{ labels: string[], datasets: any[], timeUnit: string, stepSize: number }> {
  // Sort issues by creation date
  const sortedIssues = [...issues].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

  // Find min and max dates
  const minDate = sortedIssues.length > 0 ? new Date(sortedIssues[0].created) : new Date()
  const maxDate = sortedIssues.length > 0 ? new Date(sortedIssues[sortedIssues.length - 1].created) : new Date()

  // Calculate the date range in milliseconds
  const dateRange = maxDate.getTime() - minDate.getTime()

  // Determine the appropriate time unit based on the date range
  let timeUnit
  let stepSize = 1

  // Constants for time calculations
  const HOUR = 60 * 60 * 1000
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  if (dateRange < DAY) {
    timeUnit = 'hour'
  } else if (dateRange < DAY * 2) {
    timeUnit = 'hour'
    stepSize = 3
  } else if (dateRange < WEEK * 4) {
    timeUnit = 'day'
  } else if (dateRange < MONTH * 6) {
    timeUnit = 'week'
  } else if (dateRange < YEAR) {
    timeUnit = 'month'
  } else {
    timeUnit = 'year'
  }

  // Create datasets for each issue
  const datasets = await Promise.all(sortedIssues.map(async (issue, index) => {

    // Generate a color based on index
    const hue = (index * 137) % 360 // Use golden ratio to spread colors
    const color = `hsl(${hue}, 70%, 60%)`

    return {
      label: issue.name,
      data: [{ x: issue.created, y: (await issue.metrics).cost }],
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.1,
    }
  }))

  return {
    labels: [minDate.toISOString(), maxDate.toISOString()],
    datasets,
    timeUnit,
    stepSize,
  }
}

// Project issues page route
export const projectRouteHandler = async (req: AppRequest, res: AppResponse) => {
  const locale = getLocaleFromRequest(req)
  
  try {
    const { jetBrains, project } = req

    if (!jetBrains || !project) {
      return res.status(404).send('Project not found')
    }

    const issues = [...(await project.issues ?? []).values()]

    // Prepare graph data
    const graphData = await prepareGraphData(issues)

    const page = <HtmlPage cookies={req.cookies}>
      <AppHead title={`${project.name} Issues`}>
        <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
          <script>
            window.chartData = {JSON.stringify(graphData)};
          </script>
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
