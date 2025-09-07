import express from "express"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../../types.js"
import { LlmRequestEvent } from "../../../schema/llmRequestEvent.js"
import { LlmResponseEvent } from "../../../schema/llmResponseEvent.js"
import { AIContentAnswerChoice } from "../../../schema/AIContentAnswerChoice.js"
import { AIToolUseAnswerChoice } from "../../../schema/AIToolUseAnswerChoice.js"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Context size over time API endpoint
// Context size = inputTokens + outputTokens + cacheTokens
// For each provider, the context size must be non-decreasing over time (cumulative max)
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/trajectories/context-size', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task, issue } = req

    // Determine whether to include all tasks in the issue
    const allTasksParam = String((req.query as any)?.allTasks ?? '').toLowerCase()
    const includeAllTasks = allTasksParam === '1' || allTasksParam === 'true' || allTasksParam === 'yes' || allTasksParam === 'on'

    // Collect events from the current task or from all tasks in the issue
    let events = await task!.events
    if (includeAllTasks && issue) {
      const tasks = [...(await issue.tasks).values()]
      const eventsArrays = await Promise.all(tasks.map(t => t.events))
      events = eventsArrays.flat()
    }

    // Sort all events by timestamp first
    const sorted = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    type Row = {
      timestamp: string
      provider: string
      model: string
      contextSize: number
      description?: string
      reasoning?: string
    }

    const rows: Row[] = []

    for (let i = 0; i < sorted.length; i++) {
      const ev = sorted[i]
      if (ev.event.type === 'LlmResponseEvent') {
        const resp: LlmResponseEvent = ev.event
        const provider = resp.answer.llm.groupName
        const model = resp.answer.llm.name
        const inputTokens = resp.answer.inputTokens ?? 0
        const outputTokens = resp.answer.outputTokens ?? 0
        const cacheInputTokens = resp.answer.cacheInputTokens ?? 0
        const contextSize = inputTokens + outputTokens + cacheInputTokens

        // Find matching request for reasoning effort
        let reasoning: string | undefined = undefined
        const previous = sorted.slice(0, i).reverse().find((e): e is { event: LlmRequestEvent, timestamp: Date } => e.event.type === 'LlmRequestEvent' && e.event.id === resp.id)
        if (previous) {
          reasoning = previous.event.modelParameters.reasoning_effort
        }

        // Build a short description similar to model performance API
        const description = resp.answer.contentChoices.map(choice => {
          const maxLabelLength = 80
          if (choice.type === AIContentAnswerChoice.shape.type.value) {
            return choice.content.length <= maxLabelLength
              ? choice.content
              : choice.content.substring(0, (maxLabelLength/2)-2) + ' ... ' + choice.content.substring(choice.content.length - (maxLabelLength/2)-2)
          } else if (choice.type === AIToolUseAnswerChoice.shape.type.value) {
            return choice.usages.map(usage => {
              const params = JSON.stringify(usage.toolParams.rawJsonObject)
              const trimmedParams = params.length <= maxLabelLength ? params : params.substring(0, (maxLabelLength/2)-2) + ' ... ' + params.substring(params.length - (maxLabelLength/2)-2)
              return usage.toolName + ' ' + trimmedParams
            }).join(', ')
          }
        }).join('')

        rows.push({
          timestamp: ev.timestamp.toISOString(),
          provider,
          model,
          contextSize,
          description,
          reasoning,
        })
      } else if (ev.event.type === 'LlmRequestEvent') {
        // In case some token info is available on request, prefer response authoritative values; requests usually don't include tokens
        // Keeping this branch for possible future extension
        const reqEv: LlmRequestEvent = ev.event
        void reqEv
      }
    }

    // Group by provider
    const providerGroups: Record<string, Row[]> = {}
    for (const r of rows) {
      if (!providerGroups[r.provider]) providerGroups[r.provider] = []
      providerGroups[r.provider].push(r)
    }

    const providers = Object.keys(providerGroups).sort()

    res.json({
      contextData: rows,
      providerGroups,
      providers,
    })
  } catch (error) {
    console.error('Error fetching Context Size data:', error)
    res.status(500).json({ error: 'An error occurred while fetching Context Size data' })
  }
})

export default router
