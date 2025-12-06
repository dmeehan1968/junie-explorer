import { describe, expect, test } from "bun:test"
import { prepareLlmEventGraphData } from "../../../utils/prepareLlmEventGraphData"
import { makeGroupName } from "../trajectories/contextSize"
import { LlmResponseEvent } from "../../../schema/llmResponseEvent"

describe("chartData API logic", () => {
  const createMockEvent = (timestamp: string, overrides: Record<string, any> = {}) => ({
    timestamp: new Date(timestamp),
    event: {
      type: "LlmResponseEvent",
      answer: {
        llm: { groupName: "GPT-4", provider: "OpenAI" },
        cost: 0.01,
        inputTokens: 100,
        outputTokens: 50,
        cacheInputTokens: 10,
        cacheCreateInputTokens: 5,
        inputTokenCost: 0.005,
        outputTokenCost: 0.003,
        cacheInputTokenCost: 0.001,
        cacheCreateInputTokenCost: 0.0005,
        webSearchCount: 0,
        webSearchCost: 0,
        ...overrides,
      },
    },
  })

  describe("prepareLlmEventGraphData integration", () => {
    test("should return empty data for empty events", () => {
      const result = prepareLlmEventGraphData([])
      
      expect(result.labels).toEqual([])
      expect(result.datasets).toEqual([])
      expect(result.providers).toEqual([])
    })

    test("should return chart data with LLM events", () => {
      const events = [
        createMockEvent("2023-01-01T10:00:00Z"),
        createMockEvent("2023-01-01T10:01:00Z"),
      ]
      
      const result = prepareLlmEventGraphData(events as any)
      
      expect(result.labels).toHaveLength(2)
      expect(result.datasets.length).toBeGreaterThan(0)
      expect(result).toHaveProperty("timeUnit")
      expect(result).toHaveProperty("stepSize")
      expect(result).toHaveProperty("providers")
    })
  })

  describe("llmEvents transformation", () => {
    const transformLlmEvents = (events: any[]) => {
      return events
        .filter((e): e is { event: LlmResponseEvent, timestamp: Date } => e.event.type === 'LlmResponseEvent')
        .map(e => ({
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
        }))
    }

    test("should filter out non-LLM events", () => {
      const events = [
        createMockEvent("2023-01-01T10:00:00Z"),
        {
          timestamp: new Date("2023-01-01T10:00:30Z"),
          event: { type: "OtherEvent", data: {} },
        },
        createMockEvent("2023-01-01T10:01:00Z"),
      ]
      
      const result = transformLlmEvents(events as any)
      
      expect(result).toHaveLength(2)
      expect(result.every(e => e.event.type === "LlmResponseEvent")).toBe(true)
    })

    test("should include timestamp as ISO string", () => {
      const events = [createMockEvent("2023-01-01T10:00:00Z")]
      
      const result = transformLlmEvents(events as any)
      
      expect(result[0].timestamp).toBe("2023-01-01T10:00:00.000Z")
    })

    test("should include token and cost information", () => {
      const events = [
        createMockEvent("2023-01-01T10:00:00Z", {
          cost: 0.05,
          inputTokens: 200,
          outputTokens: 100,
          cacheInputTokens: 20,
          cacheCreateInputTokens: 10,
        }),
      ]
      
      const result = transformLlmEvents(events as any)
      
      expect(result[0].event.answer.cost).toBe(0.05)
      expect(result[0].event.answer.inputTokens).toBe(200)
      expect(result[0].event.answer.outputTokens).toBe(100)
      expect(result[0].event.answer.cacheInputTokens).toBe(20)
      expect(result[0].event.answer.cacheCreateInputTokens).toBe(10)
    })

    test("should include provider information", () => {
      const events = [createMockEvent("2023-01-01T10:00:00Z")]
      
      const result = transformLlmEvents(events as any)
      
      expect(result[0].event.answer.llm).toHaveProperty("provider")
    })
  })
})
