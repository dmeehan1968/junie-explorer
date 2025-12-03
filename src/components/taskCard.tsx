import { Component, Html, Children } from "@kitajs/html"
import { marked } from 'marked'
import { formatSeconds } from '../utils/timeUtils.js'
import { SummaryMetrics } from '../schema.js'
import { Conditional } from './conditional.js'
import { ToggleComponent } from './toggleComponent.js'
import { ExpandIcon } from './expandIcon.js'
import { CollapseIcon } from './collapseIcon.js'

export interface TaskCardProps {
  projectName: string
  issueId: string
  taskIndex: number | string
  task: {
    id: string | number
    created: Date | string | number
    context: { description?: string }
    metrics: Promise<SummaryMetrics>
  }
  locale: string | undefined
  title?: string
  issueTitle?: string
  showLinks?: boolean
  actionsHtml?: Children
  tasksCount?: number
  tasksDescriptions?: string[]
  currentTab?: 'events' | 'trajectories'
}

const StepTotalsTable: Component<{ summaryData: SummaryMetrics }> = ({ summaryData }) => (
  <div class="overflow-x-auto mb-4" data-testid="task-metrics">
    <table class="table w-full bg-base-300">
      <tbody>
        <tr>
          <Conditional condition={summaryData.metricCount > 0}>
            <td class="text-sm text-center">
              <span class="font-semibold">Input Tokens:</span> {summaryData.inputTokens}
            </td>
            <td class="text-sm text-center">
              <span class="font-semibold">Output Tokens:</span> {summaryData.outputTokens}
            </td>
            <td class="text-sm text-center">
              <span class="font-semibold">Cache Tokens:</span> {summaryData.cacheTokens}
            </td>
            <td class="text-sm text-center">
              <span class="font-semibold">Cost:</span> {summaryData.cost.toFixed(4)}
            </td>
          </Conditional>
          <td class="text-sm text-center">
            <span class="font-semibold">Total Time:</span> {formatSeconds(summaryData.time / 1000)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

const firstNWords = (text: string, n: number): string => {
  if (!text) return ''
  const words = text.trim().split(/\s+/)
  const slice = words.slice(0, n).join(' ')
  return words.length > n ? `${slice}…` : slice
}

const TaskSwitcher: Component<{ 
  tasksCount: number
  taskId: string | number
  taskIndex: number | string
  projectName: string
  issueId: string
  tasksDescriptions?: string[]
  currentTab?: 'events' | 'trajectories'
}> = ({ tasksCount, taskId, taskIndex, projectName, issueId, tasksDescriptions, currentTab }) => {
  const groupName = `task-switch-${encodeURIComponent(String(taskId))}`
  
  return (
    <div class="mb-4" data-testid="task-switcher">
      <div class="join w-full grid" style={`grid-template-columns: repeat(${tasksCount}, minmax(0, 1fr));`}>
        {Array.from({ length: tasksCount }, (_, i) => {
          const isCurrent = Number(taskIndex) === i
          const href = `/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(String(i))}/${encodeURIComponent(currentTab ?? 'events')}`
          const desc = tasksDescriptions && tasksDescriptions[i] ? tasksDescriptions[i] : undefined
          const label = desc ? firstNWords(desc, 5) : (i === 0 ? 'Initial' : `Follow ${i}`)
          
          return (
            <input 
              class="btn btn-sm join-item w-full p-2 h-auto min-h-0 whitespace-normal break-words" 
              name={groupName} 
              type="radio" 
              checked={isCurrent}
              aria-label={label} 
              title={desc ?? label} 
              onclick={`window.location.href = '${href}'`}
            />
          )
        })}
      </div>
    </div>
  )
}

export const TaskCard: Component<TaskCardProps> = async ({ 
  projectName, 
  issueId, 
  taskIndex, 
  task, 
  locale, 
  title, 
  issueTitle, 
  showLinks = true, 
  actionsHtml, 
  tasksCount,
  tasksDescriptions, 
  currentTab 
}) => {
  const computedTitle = title ?? issueTitle ?? (Number(taskIndex) === 0 ? 'Initial Request' : `Follow up ${taskIndex}`)
  const created = new Date(task.created)
  const metrics = await task.metrics
  const basePath = `/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(String(taskIndex))}`

  return (
    <>
      <Conditional condition={showLinks}>
        <div
          class="tabs tabs-boxed tabs-lg mb-0 flex gap-2 justify-start"
          data-testid="task-tab-group"
        >
          <button
            class={`tab text-lg font-bold border border-base-300 border-b-0 rounded-t-xl ${currentTab === 'trajectories'
              ? 'tab-active bg-base-200 text-primary'
              : 'bg-base-100 text-base-content/70'
            }`}
            aria-label="Trajectories"
            onclick={`window.location.href = '${basePath}/trajectories'`}
          >
            Trajectories
          </button>
          <button
            class={`tab text-lg font-bold border border-base-300 border-b-0 rounded-t-xl ${currentTab === 'events' || !currentTab
              ? 'tab-active bg-base-200 text-primary'
              : 'bg-base-100 text-base-content/70'
            }`}
            aria-label="Events"
            onclick={`window.location.href = '${basePath}/events'`}
          >
            Events
          </button>
        </div>
      </Conditional>

      <div class="card bg-base-200 shadow-md border border-base-300 rounded-t-none hover:shadow-lg transition-all duration-300" data-testid="task-item">
        <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-primary">{computedTitle}</h3>
          <Conditional condition={!!actionsHtml}>
            <div class="ml-2">{actionsHtml}</div>
          </Conditional>
        </div>
        
        <div class="flex justify-between items-center gap-2 bg-base-300 mb-4 p-4 rounded">
          <div class="text-sm text-base-content/70">ID: {task.id}</div>
          <div class="text-sm text-base-content/70">Created: {created.toLocaleString(locale)}</div>
        </div>
        
        <Conditional condition={typeof tasksCount === 'number' && tasksCount > 0}>
          <TaskSwitcher 
            tasksCount={tasksCount!}
            taskId={task.id}
            taskIndex={taskIndex}
            projectName={projectName}
            issueId={issueId}
            tasksDescriptions={tasksDescriptions}
            currentTab={currentTab}
          />
        </Conditional>
        
        <Conditional condition={!!task.context.description}>
          <div class="relative mb-4">
            <ToggleComponent
              expandIcon={<ExpandIcon />}
              collapseIcon={<CollapseIcon />}
              testId="task-description-toggle"
            />
            <div
              class="prose prose-sm max-w-none p-4 bg-base-300 rounded-lg content-wrapper max-h-[200px] overflow-auto transition-all duration-300 ease-in-out"
              data-testid="task-description"
            >
              {marked(task.context.description!)}
            </div>
          </div>
        </Conditional>
        
        <div data-testid="task-details">
          <StepTotalsTable summaryData={metrics} />
        </div>
      </div>
    </div>
    </>
  )
}
