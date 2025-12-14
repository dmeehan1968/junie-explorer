// Issue Row Component
import { Html } from "@kitajs/html"
import { Issue } from "../Issue"
import { Project } from "../Project"
import { buildAssistantProviders } from "../utils/assistantProviders"
import { escapeHtml } from "../utils/escapeHtml"
import { formatNumber, formatSeconds } from "../utils/timeUtils"
import { Conditional } from "./conditional"
import { StatusBadge } from "./statusBadge"

export const IssueRow = async ({ issue, project, locale, customDescription }: {
  issue: Issue,
  project: Project,
  locale: string | undefined,
  customDescription?: string
}) => {
  const tasks = await issue.tasks
  const hasTasks = tasks.size > 0
  const href = hasTasks
    ? `/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/0/trajectories`
    : `/project/${encodeURIComponent(project.name)}`
  const metrics = await issue.metrics
  const assistantProvidersRaw = Array.from(await issue.assistantProviders)
  const assistantProviders = buildAssistantProviders(assistantProvidersRaw)
  const displayName = customDescription || issue.name

  return (
    <tr
      data-issue-id={issue.id}
      class="cursor-pointer hover:bg-accent! transition-all duration-200 hover:translate-x-1 border-transparent hover:shadow-md">
      <Conditional condition={project.hasMetrics}>
        <td class="text-center align-top py-3 px-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm issue-select"
            aria-label="Select issue for comparison"
            data-issue-id={escapeHtml(issue.id)}
            data-issue-name={escapeHtml(displayName)}
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
        class="text-left whitespace-normal wrap-break-word w-2/5 align-top py-3 px-2 group/desc"
        data-testid="issue-description"
        data-issue-description-editable="true"
        data-issue-id={issue.id}
        data-original-description={escapeHtml(issue.name)}
      >
        <div class="flex items-start gap-2">
          <div class="flex-1">
            <a
              class="font-bold text-primary"
              href={href}
              data-testid="issue-description-link"
              onclick="event.stopPropagation()"
            >
              {escapeHtml(displayName)}
            </a>
            <span class="text-neutral/50">{tasks.size > 1 ? ` (${tasks.size})` : ''}</span>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover/desc:opacity-100 transition-opacity">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              data-testid="edit-description-btn"
              aria-label="Edit description"
              onclick="event.stopPropagation()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <Conditional condition={issue.isAIA}>
              <button
                type="button"
                class="btn btn-ghost btn-xs merge-up-btn"
                data-testid="merge-up-btn"
                data-issue-id={issue.id}
                data-project-name={project.name}
                data-is-aia="true"
                aria-label="Merge with issue above"
                title="Merge with issue above"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18V15C6 12 9 10 12 10M18 18V15C18 12 15 10 12 10M12 10V3M12 3L9 6M12 3L15 6" />
                </svg>
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs merge-down-btn"
                data-testid="merge-down-btn"
                data-issue-id={issue.id}
                data-project-name={project.name}
                data-is-aia="true"
                aria-label="Merge with issue below"
                title="Merge with issue below"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6V9C6 12 9 14 12 14M18 6V9C18 12 15 14 12 14M12 14V21M12 21L9 18M12 21L15 18" />
                </svg>
              </button>
              <Conditional condition={tasks.size > 1}>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs unmerge-btn"
                  data-testid="unmerge-btn"
                  data-issue-id={issue.id}
                  data-project-name={project.name}
                  data-is-aia="true"
                  aria-label="Unmerge issue"
                  title="Unmerge issue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {/* Single solid path on left */}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12H12" />
                    {/* Two dotted paths on right indicating split */}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" stroke-dasharray="2 2" d="M12 12L20 6" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" stroke-dasharray="2 2" d="M12 12L20 18" />
                    {/* Arrow heads on the dotted paths */}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 4L20 6L17 8" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16L20 18L17 20" />
                  </svg>
                </button>
              </Conditional>
            </Conditional>
          </div>
        </div>
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
        class="text-center whitespace-normal wrap-break-word align-middle py-3 px-2"
        data-testid="issue-assistant-providers"
        role="link"
        tabindex="0"
        onclick={`window.location.href='${href}'`}
        onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
      >
        {assistantProviders.length ? (
          <div class="flex items-center justify-center gap-2">
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
      <td
        class="text-center whitespace-normal wrap-break-word align-middle py-3 px-2"
        data-testid="issue-agent"
        role="link"
        tabindex="0"
        onclick={`window.location.href='${href}'`}
        onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='${href}'}`}
      >
        {(() => {
          const agentIcon = issue.isAIA
            ? 'https://resources.jetbrains.com/storage/products/company/brand/logos/AI_icon.svg'
            : 'https://resources.jetbrains.com/storage/products/company/brand/logos/Junie_icon.svg'
          const agentName = issue.isAIA ? 'AI Assistant' : 'Junie'
          return (
            <div class="tooltip tooltip-left" data-tip={agentName}>
              <img
                class="h-4 w-4"
                src={agentIcon}
                role="img"
                aria-label={`${agentName} icon`}
              />
            </div>
          )
        })()}
      </td>
    </tr>
  )
}