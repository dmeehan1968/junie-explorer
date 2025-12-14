import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { TaskIssueMapStore } from "./TaskIssueMapStore"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"

describe("TaskIssueMapStore", () => {
  let tempDir: string
  let store: TaskIssueMapStore

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "junie-explorer-test-"))
    store = new TaskIssueMapStore(tempDir)
  })

  afterEach(async () => {
    await fs.remove(tempDir)
  })

  describe("getIssueIdForTask", () => {
    test("returns undefined when no mapping exists", async () => {
      const result = await store.getIssueIdForTask("task-123")
      expect(result).toBeUndefined()
    })

    test("returns the issue ID when mapping exists", async () => {
      const jsonPath = path.join(tempDir, ".junie-explorer", "taskIssueMap.json")
      await fs.ensureDir(path.dirname(jsonPath))
      await fs.writeJson(jsonPath, {
        mappings: {
          "task-123": "issue-456"
        }
      })

      const result = await store.getIssueIdForTask("task-123")
      expect(result).toBe("issue-456")
    })
  })

  describe("setTaskIssueMapping", () => {
    test("saves a task to issue mapping", async () => {
      await store.setTaskIssueMapping("task-123", "issue-456")

      const result = await store.getIssueIdForTask("task-123")
      expect(result).toBe("issue-456")
    })

    test("creates the .junie-explorer directory if it does not exist", async () => {
      await store.setTaskIssueMapping("task-123", "issue-456")

      const dirExists = await fs.pathExists(path.join(tempDir, ".junie-explorer"))
      expect(dirExists).toBe(true)
    })

    test("preserves other data in taskIssueMap.json", async () => {
      const jsonPath = path.join(tempDir, ".junie-explorer", "taskIssueMap.json")
      await fs.ensureDir(path.dirname(jsonPath))
      await fs.writeJson(jsonPath, {
        mappings: {
          "other-task": "other-issue"
        },
        otherData: { key: "value" }
      })

      await store.setTaskIssueMapping("task-123", "issue-456")

      const data = await fs.readJson(jsonPath)
      expect(data.mappings["other-task"]).toBe("other-issue")
      expect(data.otherData).toEqual({ key: "value" })
    })

    test("overwrites existing mapping for the same task", async () => {
      await store.setTaskIssueMapping("task-123", "issue-old")
      await store.setTaskIssueMapping("task-123", "issue-new")

      const result = await store.getIssueIdForTask("task-123")
      expect(result).toBe("issue-new")
    })
  })

  describe("getMappingsForIssue", () => {
    test("returns empty array when no mappings exist for issue", async () => {
      const result = await store.getMappingsForIssue("issue-456")
      expect(result).toEqual([])
    })

    test("returns all task IDs mapped to the issue", async () => {
      await store.setTaskIssueMapping("task-1", "issue-456")
      await store.setTaskIssueMapping("task-2", "issue-456")
      await store.setTaskIssueMapping("task-3", "issue-other")

      const result = await store.getMappingsForIssue("issue-456")
      expect(result).toEqual(["task-1", "task-2"])
    })
  })

  describe("removeMapping", () => {
    test("removes an existing mapping", async () => {
      await store.setTaskIssueMapping("task-123", "issue-456")
      await store.removeMapping("task-123")

      const result = await store.getIssueIdForTask("task-123")
      expect(result).toBeUndefined()
    })

    test("does nothing when mapping does not exist", async () => {
      await store.removeMapping("nonexistent-task")

      const result = await store.getIssueIdForTask("nonexistent-task")
      expect(result).toBeUndefined()
    })

    test("preserves other mappings when removing one", async () => {
      await store.setTaskIssueMapping("task-1", "issue-456")
      await store.setTaskIssueMapping("task-2", "issue-456")
      await store.removeMapping("task-1")

      const result1 = await store.getIssueIdForTask("task-1")
      const result2 = await store.getIssueIdForTask("task-2")
      expect(result1).toBeUndefined()
      expect(result2).toBe("issue-456")
    })
  })

  describe("getAllMappings", () => {
    test("returns empty object when no mappings exist", async () => {
      const result = await store.getAllMappings()
      expect(result).toEqual({})
    })

    test("returns all task to issue mappings", async () => {
      await store.setTaskIssueMapping("task-1", "issue-1")
      await store.setTaskIssueMapping("task-2", "issue-2")

      const result = await store.getAllMappings()
      expect(result).toEqual({
        "task-1": "issue-1",
        "task-2": "issue-2"
      })
    })
  })
})
