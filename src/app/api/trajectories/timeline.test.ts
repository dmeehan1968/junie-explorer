import { describe, expect, test } from "bun:test"
import { buildActionEvents } from "./timeline"

describe("buildActionEvents", () => {
  const ts = new Date("2024-01-01T10:00:00Z")

  const makeStarted = (name: string, params: Record<string, unknown> = {}) => ({
    timestamp: ts,
    event: {
      type: "AgentActionExecutionStarted" as const,
      actionToExecute: { name, inputParams: params },
    },
  })

  const makeFinished = (name: string) => ({
    timestamp: new Date(ts.getTime() + 1000),
    event: {
      type: "AgentActionExecutionFinished" as const,
      actionToExecute: { name, inputParams: {} },
      result: { text: "ok" },
    },
  })

  const makeBackwardCompatible = (actionRequests: { name: string; inputParams: Record<string, unknown> }[]) => ({
    timestamp: ts,
    event: {
      type: "com.intellij.ml.llm.matterhorn.agent.BackwardCompatibleActionRequestBuildingFinishedSerializer.Surrogate" as const,
      attemptNumber: 1,
      actionRequests,
    },
  })

  test("includes AgentActionExecutionStarted events", () => {
    const events = [makeStarted("myAction", { path: "/foo" })]
    const result = buildActionEvents(events as any)
    expect(result).toHaveLength(1)
    expect(result[0].eventType).toBe("AgentActionExecutionStarted")
    expect(result[0].actionName).toBe("myAction")
  })

  test("includes AgentActionExecutionFinished events", () => {
    const events = [makeFinished("myAction")]
    const result = buildActionEvents(events as any)
    expect(result).toHaveLength(1)
    expect(result[0].eventType).toBe("AgentActionExecutionFinished")
  })

  test("includes BackwardCompatibleActionRequestBuildingFinished events as one entry per actionRequest", () => {
    const events = [
      makeBackwardCompatible([
        { name: "actionA", inputParams: { path: "/a" } },
        { name: "actionB", inputParams: { path: "/b" } },
      ]),
    ]
    const result = buildActionEvents(events as any)
    expect(result).toHaveLength(2)
    expect(result[0].eventType).toBe("BackwardCompatibleActionRequestBuildingFinished")
    expect(result[0].actionName).toBe("actionA")
    expect(result[1].actionName).toBe("actionB")
  })

  test("includes timestamp for BackwardCompatibleActionRequestBuildingFinished events", () => {
    const events = [makeBackwardCompatible([{ name: "actionA", inputParams: {} }])]
    const result = buildActionEvents(events as any)
    expect(result[0].timestamp).toBe(ts.toISOString())
  })

  test("includes inputParamValue for BackwardCompatibleActionRequestBuildingFinished events", () => {
    const events = [makeBackwardCompatible([{ name: "actionA", inputParams: { path: "/foo" } }])]
    const result = buildActionEvents(events as any)
    expect(result[0].inputParamValue).toBe(JSON.stringify({ path: "/foo" }))
  })

  test("filters out unrelated event types", () => {
    const events = [{ timestamp: ts, event: { type: "SomeOtherEvent" } }]
    const result = buildActionEvents(events as any)
    expect(result).toHaveLength(0)
  })
})
