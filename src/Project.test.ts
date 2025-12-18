import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test"
import { Project } from "./Project"
import { TaskIssueMapStore } from "./services/TaskIssueMapStore"
import { CompositeIssueDiscoveryService } from "./services/CompositeIssueDiscoveryService"
import { Issue } from "./Issue"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"

describe("Project", () => {
  let tempDir: string
  let fixturesDir: string
  let taskIssueMapStore: TaskIssueMapStore

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "junie-explorer-project-test-"))
    fixturesDir = path.join(__dirname, "..", "fixtures")
    taskIssueMapStore = new TaskIssueMapStore(tempDir)
  })

  afterEach(async () => {
    await fs.remove(tempDir)
  })

  describe("AIA issues chronological ordering", () => {
    test("AIA issues should be sorted by creation date (newest first)", async () => {
      // Create a temp directory structure for AIA events
      const logPath = path.join(tempDir, "test-project", ".matterhorn")
      const eventsPath = path.join(logPath, "events")
      const issuesPath = path.join(logPath, "issues")
      await fs.ensureDir(eventsPath)
      await fs.ensureDir(issuesPath)

      // Create 3 AIA event files with different timestamps
      // File names are UUIDs that would sort alphabetically as: aaa < bbb < ccc
      // But we want them sorted by mtime: oldest (ccc) -> middle (aaa) -> newest (bbb)
      const eventContent = JSON.stringify({ timestampMs: Date.now(), event: { type: "TaskSummaryCreatedEvent", taskSummary: "Test" } }) + "\n"

      const file1 = path.join(eventsPath, "aaaaaaaa-1111-4111-8111-111111111111-events.jsonl")
      const file2 = path.join(eventsPath, "bbbbbbbb-2222-4222-8222-222222222222-events.jsonl")
      const file3 = path.join(eventsPath, "cccccccc-3333-4333-8333-333333333333-events.jsonl")

      await fs.writeFile(file1, eventContent)
      await fs.writeFile(file2, eventContent)
      await fs.writeFile(file3, eventContent)

      // Set different modification times (mtime determines creation date for AIA issues)
      const now = Date.now()
      const oldest = new Date(now - 3000)  // 3 seconds ago - ccc
      const middle = new Date(now - 2000)  // 2 seconds ago - aaa
      const newest = new Date(now - 1000)  // 1 second ago - bbb

      await fs.utimes(file3, oldest, oldest)  // ccc is oldest
      await fs.utimes(file1, middle, middle)  // aaa is middle
      await fs.utimes(file2, newest, newest)  // bbb is newest

      const project = new Project("test-project", logPath, "TestIDE", taskIssueMapStore)
      const issues = await project.issues

      // Convert to array to check order
      const issueIds = [...issues.keys()]

      // Issues should be sorted newest first (descending by created date)
      // Expected order: bbb (newest), aaa (middle), ccc (oldest)
      expect(issueIds.length).toBe(3)
      expect(issueIds[0]).toContain("bbbbbbbb")  // newest first
      expect(issueIds[1]).toContain("aaaaaaaa")  // middle
      expect(issueIds[2]).toContain("cccccccc")  // oldest last
    })

    test("tasks within an AIA issue should be sorted chronologically (oldest first)", async () => {
      // Create a temp directory structure for AIA events
      const logPath = path.join(tempDir, "test-project2", ".matterhorn")
      const eventsPath = path.join(logPath, "events")
      const issuesPath = path.join(logPath, "issues")
      await fs.ensureDir(eventsPath)
      await fs.ensureDir(issuesPath)

      // Create 3 AIA event files that will be merged into one issue
      const eventContent = JSON.stringify({ timestampMs: Date.now(), event: { type: "TaskSummaryCreatedEvent", taskSummary: "Test" } }) + "\n"

      const targetUuid = "aaaaaaaa-1111-4111-8111-111111111111"
      const source1Uuid = "bbbbbbbb-2222-4222-8222-222222222222"
      const source2Uuid = "cccccccc-3333-4333-8333-333333333333"

      const file1 = path.join(eventsPath, `${targetUuid}-events.jsonl`)
      const file2 = path.join(eventsPath, `${source1Uuid}-events.jsonl`)
      const file3 = path.join(eventsPath, `${source2Uuid}-events.jsonl`)

      await fs.writeFile(file1, eventContent)
      await fs.writeFile(file2, eventContent)
      await fs.writeFile(file3, eventContent)

      // Set different modification times
      const now = Date.now()
      const oldest = new Date(now - 3000)  // target is oldest
      const middle = new Date(now - 2000)  // source2 (ccc) is middle
      const newest = new Date(now - 1000)  // source1 (bbb) is newest

      await fs.utimes(file1, oldest, oldest)
      await fs.utimes(file3, middle, middle)
      await fs.utimes(file2, newest, newest)

      // Set up mappings to merge source tasks into target issue
      const targetIssueId = `${targetUuid} 0`
      await taskIssueMapStore.setTaskIssueMapping(`${source1Uuid} 0`, targetIssueId)
      await taskIssueMapStore.setTaskIssueMapping(`${source2Uuid} 0`, targetIssueId)

      const project = new Project("test-project2", logPath, "TestIDE", taskIssueMapStore)
      const issues = await project.issues

      // Should have only 1 issue (all merged)
      expect(issues.size).toBe(1)

      const issue = issues.get(targetIssueId)
      expect(issue).toBeDefined()

      const tasks = await issue!.tasks
      const taskIds = [...tasks.keys()]

      // Tasks should be sorted oldest first (ascending by created date)
      // Expected order: target (oldest), source2/ccc (middle), source1/bbb (newest)
      expect(taskIds.length).toBe(3)
      expect(taskIds[0]).toContain(targetUuid)   // oldest first
      expect(taskIds[1]).toContain(source2Uuid)  // middle
      expect(taskIds[2]).toContain(source1Uuid)  // newest last
    })
  })

  describe("issues getter with TaskIssueMapStore", () => {
    test("groups AIA tasks into existing issues based on persisted mappings", async () => {
      // Use the aia-only-test fixture which has pure AIA event files (no chain files)
      const logPath = path.join(
        fixturesDir,
        "WebStorm2025.1",
        "projects",
        "aia-only-test",
        "matterhorn",
        ".matterhorn"
      )

      const targetUuid = "aaaaaaaa-1111-4111-8111-111111111111"
      const sourceUuid = "bbbbbbbb-2222-4222-8222-222222222222"
      const targetIssueId = targetUuid + " 0"
      const sourceIssueId = sourceUuid + " 0"
      const sourceTaskId = sourceUuid + " 0"

      // Create a project with the TaskIssueMapStore
      const project = new Project("aia-only-test", logPath, "WebStorm", taskIssueMapStore)

      // Get all issues first to see what AIA tasks exist
      const issuesBefore = await project.issues
      const aiaIssues = [...issuesBefore.values()].filter(issue => issue.isAIA)

      // We need at least 2 AIA issues to test merging
      expect(aiaIssues.length).toBeGreaterThanOrEqual(2)

      // Verify both issues exist before mapping
      expect(issuesBefore.has(targetIssueId)).toBe(true)
      expect(issuesBefore.has(sourceIssueId)).toBe(true)

      // Persist the mapping: sourceTaskId -> targetIssueId
      await taskIssueMapStore.setTaskIssueMapping(sourceTaskId, targetIssueId)

      // Reload the project to simulate server restart
      project.reload()

      // Get issues again - now the source task should be grouped into target issue
      const issuesAfter = await project.issues

      // The source issue should no longer exist as a separate issue
      expect(issuesAfter.has(sourceIssueId)).toBe(false)

      // The target issue should still exist and now have 2 tasks
      const targetIssueAfter = issuesAfter.get(targetIssueId)
      expect(targetIssueAfter).toBeDefined()

      const targetTasksAfter = await targetIssueAfter!.tasks
      expect(targetTasksAfter.size).toBe(2)
    })
  })

  describe("Project (Isolated)", () => {
    test("should use CompositeIssueDiscoveryService to load issues", async () => {
      const mockIssue = {
        id: "issue-1",
        created: new Date(),
        metrics: Promise.resolve({ metricCount: 0 })
      } as unknown as Issue

      const mockDiscoveryService = {
        discover: mock(async () => new Map([["issue-1", mockIssue]]))
      } as unknown as CompositeIssueDiscoveryService

      const project = new Project("test-project", "log/path", "TestIDE", undefined, mockDiscoveryService)
      const issues = await project.issues

      expect(mockDiscoveryService.discover).toHaveBeenCalledWith(["log/path"])
      expect(issues.size).toBe(1)
      expect(issues.get("issue-1")).toBe(mockIssue)
    })

    test("should sort issues by creation date descending", async () => {
      const olderDate = new Date("2023-01-01")
      const newerDate = new Date("2023-01-02")

      const olderIssue = { id: "older", created: olderDate } as Issue
      const newerIssue = { id: "newer", created: newerDate } as Issue

      const mockDiscoveryService = {
        discover: mock(async () => new Map([
          ["older", olderIssue],
          ["newer", newerIssue]
        ]))
      } as unknown as CompositeIssueDiscoveryService

      const project = new Project("test-project", "log/path", "TestIDE", undefined, mockDiscoveryService)
      const issues = await project.issues

      const keys = [...issues.keys()]
      expect(keys[0]).toBe("newer")
      expect(keys[1]).toBe("older")
      expect(project.lastUpdated).toEqual(newerDate)
    })
  })
})
