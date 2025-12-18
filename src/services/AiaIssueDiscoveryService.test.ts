import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { AiaIssueDiscoveryService } from "./AiaIssueDiscoveryService"
import { TaskIssueMapStore } from "./TaskIssueMapStore"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"

describe("AiaIssueDiscoveryService", () => {
  let tempDir: string
  let taskIssueMapStore: TaskIssueMapStore
  let discoveryService: AiaIssueDiscoveryService

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "junie-explorer-aia-discovery-test-"))
    taskIssueMapStore = new TaskIssueMapStore(tempDir)
    discoveryService = new AiaIssueDiscoveryService(taskIssueMapStore)
  })

  afterEach(async () => {
    await fs.remove(tempDir)
  })

  test("should discover AIA tasks from events files", async () => {
    const logPath = path.join(tempDir, "project2")
    const eventsPath = path.join(logPath, "events")
    await fs.ensureDir(eventsPath)

    const uuid = "bbbbbbbb-2222-4222-8222-222222222222"
    const filePath = path.join(eventsPath, `${uuid}-events.jsonl`)
    const eventContent = JSON.stringify({ timestampMs: Date.now(), event: { type: "TaskSummaryCreatedEvent", taskSummary: "Test" } }) + "\n"
    await fs.writeFile(filePath, eventContent)

    const issues = await discoveryService.discover([logPath])
    
    // When an AIA task is discovered and not mapped, it creates an issue with ID = UUID + " 0"
    expect(issues.has(uuid + " 0")).toBe(true)
    
    const issue = issues.get(uuid + " 0")!
    // Wait for async name loading in Issue constructor
    for (let i = 0; i < 20; i++) {
      if (issue.name === "Test") break
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    expect(issue.name).toBe("Test")
  })
})
