import express from "express"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../../types.js"
import { LlmRequestEvent } from "../../../schema/llmRequestEvent.js"
import { LlmResponseEvent } from "../../../schema/llmResponseEvent.js"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// Context size over time API endpoint
// Context size = inputTokens + outputTokens + cacheTokens
// For each provider, the context size must be non-decreasing over time (cumulative max)
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/trajectories/context-size', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req
    const events = await task!.events

    // Sort all events by timestamp first
    const sorted = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    type Row = {
      timestamp: string
      provider: string
      model: string
      contextSize: number
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

        rows.push({
          timestamp: ev.timestamp.toISOString(),
          provider,
          model,
          contextSize,
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
