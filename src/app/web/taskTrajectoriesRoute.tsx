import { renderToStream } from "@kitajs/html/suspense"
import express from 'express'
import { ActionTimelineSection } from "../../components/actionTimelineSection"
import { AppBody } from "../../components/appBody"
import { AppHead } from "../../components/appHead"
import { AppHeader } from "../../components/appHeader"
import { Breadcrumb } from '../../components/breadcrumb.js'
import { ContextSizeSection } from "../../components/contextSizeSection"
import { HtmlPage } from "../../components/htmlPage"
import { ImageModal } from "../../components/imageModal"
import { MessageTrajectoriesSection } from "../../components/messageTrajectoriesSection"
import { ModelPerformanceSection } from "../../components/modelPerformanceSection"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatsButton } from '../../components/statsButton.js'
import { TaskCard } from '../../components/taskCard.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest"
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../types"

const router = express.Router({ mergeParams: true })

router.use('/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Task trajectories page route
router.get('/project/:projectId/issue/:issueId/task/:taskId/trajectories', async (req: AppRequest, res: AppResponse) => {
  try {
    const { jetBrains, project, issue, task } = req

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Load events
    const events = await task.events

    // Check if there are action events for conditional rendering
    const hasActionEvents = events.some(e => e.event.type === 'AgentActionExecutionStarted')
    const actionCount = events.filter(e => e.event.type === 'AgentActionExecutionStarted').length
    const hasMetrics = project.hasMetrics
    
    const tasksCount = (await issue.tasks).size
    const tasksDescriptions = [...(await issue.tasks).values()].map(t => t?.context?.description ?? '')

    const url = new URL(req.originalUrl ?? req.url, 'http://localhost')
    const showAllDiffsParam = url.searchParams.get('showAllDiffs')
    const showAllDiffs = showAllDiffsParam === '1'

    const toggledUrl = new URL(url)
    if (showAllDiffs) {
      toggledUrl.searchParams.delete('showAllDiffs')
    } else {
      toggledUrl.searchParams.set('showAllDiffs', '1')
    }

    const toggleHref = `${toggledUrl.pathname}${toggledUrl.search}`

    // Generate JSX page
    const page = async (rid: number | string) => <HtmlPage cookies={req.cookies}>
      <AppHead title={`${project.name} ${issue.name} ${task.id} Trajectories`}>
        <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/collapsibleSections.js"></script>
        <script src="/js/taskActionChart.js"></script>
        <script src="/js/taskModelPerformanceChart.js"></script>
        <script src="/js/taskContextSizeChart.js"></script>
        <script src="/js/trajectoryToggle.js"></script>
        <script src="/js/imageModal.js"></script>
      </AppHead>
      <AppBody>
        <AppHeader title={project.name} actions={[<ThemeSwitcher/>, <StatsButton/>, <ReloadButton/>]}/>
        <VersionBanner version={jetBrains?.version}/>
        <Breadcrumb items={[
          { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
          { label: project.name, href: `/project/${encodeURIComponent(project.name)}`, testId: 'breadcrumb-project-name' },
          { label: issue.name, testId: 'breadcrumb-issue-name' },
        ]}/>

        <div class="flex gap-2 mb-5" data-testid="ide-icons">
          {project.ideNames.map((ide: string) => (
            <img src={jetBrains?.getIDEIcon(ide)} alt={ide} title={ide} class="w-8 h-8" />
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
            actionsHtml: hasMetrics ? `<a href="/api/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/${encodeURIComponent(task.index)}/trajectories/download" class="btn btn-primary btn-sm" data-testid="download-btn">Download Trajectories as JSONL</a>` : '',
            tasksCount,
            tasksDescriptions,
            currentTab: 'trajectories',
          })}
        </div>

        <ActionTimelineSection hasActionEvents={hasActionEvents} actionCount={actionCount} />
        <ModelPerformanceSection hasMetrics={hasMetrics} />
        <ContextSizeSection showIncludeAllTasks={tasksCount > 1} />
        <MessageTrajectoriesSection events={events} showAllDiffs={showAllDiffs} toggleHref={toggleHref} />
      </AppBody>
      <ImageModal />
    </HtmlPage>

    renderToStream(page).pipe(res)

  } catch (error) {
    console.error('Error generating task trajectories page:', error)
    res.status(500).send('An error occurred while generating the task trajectories page')
  }
})

export default router