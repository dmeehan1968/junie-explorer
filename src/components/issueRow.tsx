// Issue Row Component
import { Html } from "@kitajs/html"
import { Issue } from "../Issue"
import { Project } from "../Project"
import { buildAssistantProviders } from "../utils/assistantProviders"
import { escapeHtml } from "../utils/escapeHtml"
import { formatNumber, formatSeconds } from "../utils/timeUtils"
import { Conditional } from "./conditional"
import { StatusBadge } from "./statusBadge"

export const IssueRow = async ({ issue, project, locale }: {
  issue: Issue,
  project: Project,
  locale: string | undefined
}) => {
  const tasks = await issue.tasks
  const hasTasks = tasks.size > 0
  const href = hasTasks
    ? `/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/0/trajectories`
    : `/project/${encodeURIComponent(project.name)}`
  const metrics = await issue.metrics
  const assistantProvidersRaw = Array.from(await issue.assistantProviders)
  const assistantProviders = buildAssistantProviders(assistantProvidersRaw)

  return (
    <tr
      data-issue-id={issue.id}
      class="cursor-pointer hover:!bg-accent transition-all duration-200 hover:translate-x-1 border-transparent hover:shadow-md">
      <Conditional condition={project.hasMetrics}>
        <td class="text-center align-top py-3 px-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm issue-select"
            aria-label="Select issue for comparison"
            data-issue-id={escapeHtml(issue.id)}
            data-issue-name={escapeHtml(issue.name)}
            data-input-tokens={metrics.inputTokens}
            data-output-tokens={metrics.outputTokens}
            data-cache-tokens={metrics.cacheTokens}
            data-cost={metrics.cost}
            data-time-ms={metrics.time}
            onclick="event.stopPropagation()"
          />
        </td>
      </Conditional>
      <td
        class="text-left whitespace-normal break-words w-2/5 align-top py-3 px-2"
        data-testid="issue-description"
        role="link"
        tabindex="0"
        onclick={`window.location.href='${href}'`}
        onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
      >
        <a class="font-bold text-primary" href={href} data-testid="issue-description-link">
          {escapeHtml(issue.name)}
        </a>
        <span class="text-neutral/50">{tasks.size > 1 ? `(${tasks.size})` : ''}</span>
      </td>
      <td
        class="text-left whitespace-nowrap"
        data-testid="issue-timestamp"
        role="link"
        tabindex="0"
        onclick={`window.location.href='${href}'`}
        onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
      >
        {new Date(issue.created).toLocaleString(locale)}
      </td>
      <Conditional condition={project.hasMetrics}>
        <td
          class="text-right whitespace-nowrap"
          data-testid="issue-input-tokens"
          role="link"
          tabindex="0"
          onclick={`window.location.href='${href}'`}
          onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
        >
          {formatNumber(metrics.inputTokens)}
        </td>
        <td
          class="text-right whitespace-nowrap"
          data-testid="issue-output-tokens"
          role="link"
          tabindex="0"
          onclick={`window.location.href='${href}'`}
          onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
        >
          {formatNumber(metrics.outputTokens)}
        </td>
        <td
          class="text-right whitespace-nowrap"
          data-testid="issue-cache-tokens"
          role="link"
          tabindex="0"
          onclick={`window.location.href='${href}'`}
          onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
        >
          {formatNumber(metrics.cacheTokens)}
        </td>
        <td
          class="text-right whitespace-nowrap"
          data-testid="issue-cost"
          role="link"
          tabindex="0"
          onclick={`window.location.href='${href}'`}
          onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
        >
          {metrics.cost.toFixed(4)}
        </td>
      </Conditional>
      <td
        class="text-right whitespace-nowrap"
        data-testid="issue-total-time"
        role="link"
        tabindex="0"
        onclick={`window.location.href='${href}'`}
        onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
      >
        {formatSeconds(metrics.time / 1000)}
      </td>
      <td
        class="text-right whitespace-nowrap"
        data-testid="issue-status"
        role="link"
        tabindex="0"
        onclick={`window.location.href='${href}'`}
        onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
      >
        <StatusBadge state={issue.state}/>
      </td>
      <td
        class="text-left whitespace-normal break-words align-middle py-3 px-2"
        data-testid="issue-assistant-providers"
        role="link"
        tabindex="0"
        onclick={`window.location.href='${href}'`}
        onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
      >
        {assistantProviders.length ? (
          <div class="flex items-center gap-2">
            {assistantProviders.map(({ provider, jbaiTitles }) => {
              const fileName = encodeURIComponent(provider).replace(/%20/g, ' ')
              const src = `/icons/${fileName}.svg`
              const title = jbaiTitles || provider
              return (
                <div class="tooltip tooltip-left" data-tip={title}>
                  <div
                    class="h-4 w-4 inline-block text-base-content"
                    style={`background-color: currentColor; mask: url('${src}') no-repeat center / contain; -webkit-mask: url('${src}') no-repeat center / contain;`}
                    role="img"
                    aria-label={`${provider} icon`}
                  />
                </div>
              )
            })}
          </div>
        ) : '-'}
      </td>
    </tr>
  )
}