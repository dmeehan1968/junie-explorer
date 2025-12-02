import { renderToStream } from "@kitajs/html/suspense"
import express from 'express'
import { AppBody } from "../../components/appBody"
import { AppHead } from "../../components/appHead"
import { AppHeader } from "../../components/appHeader"
import { Breadcrumb } from '../../components/breadcrumb.js'
import { Conditional } from "../../components/conditional"
import { EventFilters } from "../../components/eventFilters"
import { EventMetricsSection } from "../../components/eventMetricsSection"
import { EventsTable } from "../../components/eventsTable"
import { EventStatisticsSection } from "../../components/eventStatisticsSection"
import { EventTimelineSection } from "../../components/eventTimelineSection"
import { HtmlPage } from "../../components/htmlPage"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatsButton } from '../../components/statsButton.js'
import { TaskCard } from '../../components/taskCard.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { LlmResponseEvent } from "../../schema/llmResponseEvent"
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest"
import { prepareLlmEventGraphData } from "../../utils/prepareLlmEventGraphData"
import { makeGroupName } from "../api/trajectories/contextSize"
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../types"

const router = express.Router({ mergeParams: true })

router.use('/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Task events page route
router.get('/project/:projectId/issue/:issueId/task/:taskId/events', async (req: AppRequest, res: AppResponse) => {
  try {
    const { jetBrains, project, issue, task } = req

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    const hasMetrics = (await task.metrics).metricCount > 0

    // Get events for the task
    const events = await task.events
    let cost = 0

    // Prepare LLM event graph data
    const llmChartData = prepareLlmEventGraphData(events)


    // Generate JSX page
    const eventTypes = await task.eventTypes
    const tasksCount = (await issue.tasks).size
    const tasksDescriptions = [...(await issue.tasks).values()].map((t: any) => t?.context?.description ?? '')

    const page = async (rid: number | string) => <HtmlPage cookies={req.cookies}>
      <AppHead title={`${project.name} ${issue.name} ${task.id} Events`}>
        <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
        <Conditional condition={hasMetrics}>
          <script type="application/json" id="llmChartData">{JSON.stringify(llmChartData)}</script>
          <script type="application/json" id="llmEvents">{JSON.stringify(events.filter((e): e is {
            event: LlmResponseEvent,
            timestamp: Date
          } => e.event.type === 'LlmResponseEvent').map(e => ({
            timestamp: e.timestamp.toISOString(),
            event: {
              type: e.event.type,
              answer: {
                llm: { provider: makeGroupName(e.event) },
                cost: e.event.answer.cost,
                inputTokens: e.event.answer.inputTokens,
                outputTokens: e.event.answer.outputTokens,
                cacheInputTokens: e.event.answer.cacheInputTokens,
                cacheCreateInputTokens: e.event.answer.cacheCreateInputTokens,
              },
            },
          })))}</script>
        </Conditional>
        <link rel="stylesheet" href={"https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css"}/>
        <script src={"https://code.jquery.com/jquery-3.6.0.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"}></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/taskEventChart.js"></script>
        <script src="/js/taskEventLlmChart.js"></script>
        <script src="/js/taskRawData.js"></script>
      </AppHead>
      <AppBody>
        <AppHeader title={project.name} actions={[<ThemeSwitcher/>, <StatsButton/>, <ReloadButton/>]}/>
        <VersionBanner version={jetBrains?.version}/>
        <Breadcrumb items={[
          { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
          {
            label: project.name,
            href: `/project/${encodeURIComponent(project.name)}`,
            testId: 'breadcrumb-project-name',
          },
          { label: issue?.name || '', testId: 'breadcrumb-issue-name' },
        ]}/>

        <div class="flex gap-2 mb-5" data-testid="ide-icons">
          {project.ideNames.map((ide: string) => (
            <img src={jetBrains?.getIDEIcon(ide)} alt={ide} title={ide} class="w-8 h-8"/>
          ))}
        </div>

        <div class="mb-5">
          {await TaskCard({
            projectName: project.name,
            issueId: issue.id,
            taskIndex: task.index,
            task,
            locale: getLocaleFromRequest(req),
            issueTitle: issue.name,
            actionsHtml: `<a href="/api/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/${encodeURIComponent(task.index)}/events/download" class="btn btn-primary btn-sm">Download Events as JSONL</a>`,
            tasksCount,
            tasksDescriptions,
            currentTab: 'events',
          })}
        </div>

        <EventMetricsSection hasMetrics={hasMetrics} />
        <EventTimelineSection events={events}/>
        {await EventStatisticsSection({ events, task })}
        <EventFilters eventTypes={eventTypes}/>
        <EventsTable events={events}/>
      </AppBody>

      <script src="/js/taskEventFilters.js"></script>
      <script src="/js/collapsibleSections.js"></script>
    </HtmlPage>

    renderToStream(page).pipe(res)
  } catch (error) {
    console.error('Error generating task events page:', error)
    res.status(500).send('An error occurred while generating the task events page')
  }
})

export default router