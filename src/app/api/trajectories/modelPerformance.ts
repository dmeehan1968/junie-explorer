import express from "express"
import { AgentActionExecutionFinished } from "../../../schema/agentActionExecutionFinished"
import { AIContentAnswerChoice } from "../../../schema/AIContentAnswerChoice"
import { AIToolUseAnswerChoice } from "../../../schema/AIToolUseAnswerChoice"
import { AssistantChatMessageWithToolUses } from "../../../schema/assistantChatMessageWithToolUses"
import { LlmRequestEvent, MatterhornMessage } from "../../../schema/llmRequestEvent"
import { entityLookupMiddleware } from "../../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../../types"

const router = express.Router({ mergeParams: true })

router.use('/api/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

// LLM request latency API endpoint
router.get('/api/project/:projectId/issue/:issueId/task/:taskId/trajectories/model-performance', async (req: AppRequest, res: AppResponse) => {
  try {
    const { task } = req

    // Get events for the task
    const events = await task!.events

    // Sort all events by timestamp first
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Build performance data from LLM response events
    const performanceData: Array<{
      timestamp: string
      provider: string
      model: string
      latency: number // milliseconds
      outputTokens: number
      tokensPerSecond: number
      description?: string
      reasoning?: string
    }> = []

    for (let i = 0 ; i < sortedEvents.length ; i++) {
      const currentEvent = sortedEvents[i]

      if (currentEvent.event.type === 'LlmResponseEvent') {
        const provider = currentEvent.event.answer.llm.groupName
        const model = currentEvent.event.answer.llm.name
        const latency = currentEvent.event.answer.time ?? 0
        const outputTokens = currentEvent.event.answer.outputTokens ?? 0
        const tokensPerSecond = latency > 0 ? (outputTokens / (latency / 1000)) : 0
        let reasoning: string | undefined = undefined
        // find the matching request event
        const previous = sortedEvents.slice(0, i).reverse().find((e): e is { event: LlmRequestEvent, timestamp: Date } => e.event.type === 'LlmRequestEvent' && e.event.id === currentEvent.event.id)
        if (previous) {
          reasoning = previous.event.modelParameters.reasoning_effort
        }

        let description = currentEvent.event.answer.contentChoices.map(choice => {
          const maxLabelLength = 80
          if (choice.type === AIContentAnswerChoice.shape.type.value) {
            return choice.content.length <= maxLabelLength ? choice.content : choice.content.substring(0, (maxLabelLength/2)-2) + ' ... ' + choice.content.substring(choice.content.length - (maxLabelLength/2)-2);
          } else if (choice.type === AIToolUseAnswerChoice.shape.type.value) {
            return choice.usages.map(usage => {
              const params = JSON.stringify(usage.toolParams.rawJsonObject)
              const trimmedParams = params.length <= maxLabelLength ? params : params.substring(0, (maxLabelLength/2)-2) + ' ... ' + params.substring(params.length - (maxLabelLength/2)-2);
              return usage.toolName + ' ' + trimmedParams
            }).join(', ')
          }
        }).join('')

        performanceData.push({
          timestamp: currentEvent.timestamp.toISOString(),
          provider,
          model,
          latency,
          outputTokens,
          tokensPerSecond,
          description,
          reasoning,
        })
      }
    }

    // Group by provider
    const providerGroups = performanceData.reduce((acc, item) => {
      if (!acc[item.provider]) {
        acc[item.provider] = []
      }
      acc[item.provider].push(item)
      return acc
    }, {} as Record<string, typeof performanceData>)

    // Get unique providers
    const providers = Object.keys(providerGroups).sort()

    res.json({
      performanceData,
      providerGroups,
      providers,
    })
  } catch (error) {
    console.error('Error fetching LLM latency data:', error)
    res.status(500).json({ error: 'An error occurred while fetching LLM latency data' })
  }
})

export default router