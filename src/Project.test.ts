import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { Project } from "./Project"
import { TaskIssueMapStore } from "./services/TaskIssueMapStore"
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
      const project = new Project("aia-only-test", logPath, "WebStorm", console, taskIssueMapStore)

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
})
