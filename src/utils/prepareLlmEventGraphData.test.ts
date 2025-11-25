import { describe, expect, test } from "bun:test";
import { prepareLlmEventGraphData } from "./prepareLlmEventGraphData";
import { EventRecord } from "../schema/eventRecord";

describe("prepareLlmEventGraphData", () => {
  test("should generate correct datasets including cumulative cost", () => {
    const events: EventRecord[] = [
      {
        timestamp: new Date("2023-01-01T10:00:00Z"),
        event: {
          type: "LlmResponseEvent",
          answer: {
            llm: { groupName: "GPT-4" },
            cost: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            cacheInputTokens: 0,
            cacheCreateInputTokens: 0,
          },
        },
      } as any,
      {
        timestamp: new Date("2023-01-01T10:01:00Z"),
        event: {
          type: "LlmResponseEvent",
          answer: {
            llm: { groupName: "GPT-4" },
            cost: 0.02,
            inputTokens: 150,
            outputTokens: 60,
            cacheInputTokens: 0,
            cacheCreateInputTokens: 0,
          },
        },
      } as any,
    ];

    const result = prepareLlmEventGraphData(events);

    expect(result.datasets).toHaveLength(7); // 6 existing + 1 new

    const cumulativeCostDataset = result.datasets.find(d => d.label === "Cumulative Cost");
    expect(cumulativeCostDataset).toBeDefined();
    expect(cumulativeCostDataset?.hidden).toBe(true);
    expect(cumulativeCostDataset?.data).toEqual([
      { x: "2023-01-01T10:00:00.000Z", y: 0.01 },
      { x: "2023-01-01T10:01:00.000Z", y: 0.03 }, // 0.01 + 0.02
    ]);
  });
});
