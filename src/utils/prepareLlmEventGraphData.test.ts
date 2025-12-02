import { describe, expect, test } from "bun:test"
import { prepareLlmEventGraphData } from "./prepareLlmEventGraphData"
import { EventRecord } from "../schema/eventRecord"

describe("prepareLlmEventGraphData", () => {
  const createEvent = (timestamp: string, overrides: Record<string, any> = {}): EventRecord => ({
    timestamp: new Date(timestamp),
    event: {
      type: "LlmResponseEvent",
      answer: {
        llm: { groupName: "GPT-4" },
        cost: 0.01,
        inputTokens: 100,
        outputTokens: 50,
        cacheInputTokens: 10,
        cacheCreateInputTokens: 5,
        inputTokenCost: 0.005,
        outputTokenCost: 0.003,
        cacheInputTokenCost: 0.001,
        cacheCreateInputTokenCost: 0.0005,
        webSearchCount: 2,
        webSearchCost: 0.0015,
        ...overrides,
      },
    },
  } as any)

  test("should generate correct datasets including cumulative cost", () => {
    const events: EventRecord[] = [
      createEvent("2023-01-01T10:00:00Z", { cost: 0.01 }),
      createEvent("2023-01-01T10:01:00Z", { cost: 0.02 }),
    ]

    const result = prepareLlmEventGraphData(events)

    const cumulativeCostDataset = result.datasets.find(d => d.label === "Cumulative Cost")
    expect(cumulativeCostDataset).toBeDefined()
    expect(cumulativeCostDataset?.hidden).toBe(true)
    expect(cumulativeCostDataset?.data).toEqual([
      { x: "2023-01-01T10:00:00.000Z", y: 0.01 },
      { x: "2023-01-01T10:01:00.000Z", y: 0.03 }, // 0.01 + 0.02
    ])
  })

  test("should include cost breakdown datasets", () => {
    const events: EventRecord[] = [
      createEvent("2023-01-01T10:00:00Z", {
        inputTokenCost: 0.005,
        outputTokenCost: 0.003,
        cacheInputTokenCost: 0.001,
        cacheCreateInputTokenCost: 0.0005,
        webSearchCost: 0.0015,
      }),
    ]

    const result = prepareLlmEventGraphData(events)

    const inputTokenCostDataset = result.datasets.find(d => d.label === "Input Token Cost")
    expect(inputTokenCostDataset).toBeDefined()
    expect(inputTokenCostDataset?.data[0].y).toBe(0.005)

    const outputTokenCostDataset = result.datasets.find(d => d.label === "Output Token Cost")
    expect(outputTokenCostDataset).toBeDefined()
    expect(outputTokenCostDataset?.data[0].y).toBe(0.003)

    const cacheInputTokenCostDataset = result.datasets.find(d => d.label === "Cache Input Token Cost")
    expect(cacheInputTokenCostDataset).toBeDefined()
    expect(cacheInputTokenCostDataset?.data[0].y).toBe(0.001)

    const cacheCreateInputTokenCostDataset = result.datasets.find(d => d.label === "Cache Create Input Token Cost")
    expect(cacheCreateInputTokenCostDataset).toBeDefined()
    expect(cacheCreateInputTokenCostDataset?.data[0].y).toBe(0.0005)

    const webSearchCostDataset = result.datasets.find(d => d.label === "Web Search Cost")
    expect(webSearchCostDataset).toBeDefined()
    expect(webSearchCostDataset?.data[0].y).toBe(0.0015)
  })

  test("should include webSearchCount in token datasets", () => {
    const events: EventRecord[] = [
      createEvent("2023-01-01T10:00:00Z", { webSearchCount: 3 }),
    ]

    const result = prepareLlmEventGraphData(events)

    const webSearchCountDataset = result.datasets.find(d => d.label === "Web Search Count")
    expect(webSearchCountDataset).toBeDefined()
    expect(webSearchCountDataset?.data[0].y).toBe(3)
  })

  test("should group datasets by type (cost vs tokens)", () => {
    const events: EventRecord[] = [createEvent("2023-01-01T10:00:00Z")]

    const result = prepareLlmEventGraphData(events)

    // Cost datasets should use 'y' axis
    const costDatasets = result.datasets.filter(d =>
      ["Input Token Cost", "Output Token Cost", "Cache Input Token Cost", "Cache Create Input Token Cost", "Web Search Cost"].includes(d.label)
    )
    costDatasets.forEach(dataset => {
      expect(dataset.yAxisID).toBe("y")
      expect(dataset.group).toBe("cost")
    })

    // Token datasets should use 'y1' axis
    const tokenDatasets = result.datasets.filter(d =>
      ["Input Tokens", "Output Tokens", "Cache Tokens", "Cache Create Tokens", "Web Search Count"].includes(d.label)
    )
    tokenDatasets.forEach(dataset => {
      expect(dataset.yAxisID).toBe("y1")
      expect(dataset.group).toBe("tokens")
    })
  })

  test("cost datasets should be visible by default, token datasets hidden", () => {
    const events: EventRecord[] = [createEvent("2023-01-01T10:00:00Z")]

    const result = prepareLlmEventGraphData(events)

    // Cost datasets should be visible (hidden: false or undefined)
    const costDatasets = result.datasets.filter(d =>
      ["Input Token Cost", "Output Token Cost", "Cache Input Token Cost", "Cache Create Input Token Cost", "Web Search Cost"].includes(d.label)
    )
    costDatasets.forEach(dataset => {
      expect(dataset.hidden).toBeFalsy()
    })

    // Token datasets should be hidden
    const tokenDatasets = result.datasets.filter(d =>
      ["Input Tokens", "Output Tokens", "Cache Tokens", "Cache Create Tokens", "Web Search Count"].includes(d.label)
    )
    tokenDatasets.forEach(dataset => {
      expect(dataset.hidden).toBe(true)
    })
  })
})
