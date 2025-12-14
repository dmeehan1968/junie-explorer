import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { Issue } from "./Issue"
import { Task } from "./Task"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"

describe("Issue", () => {
  describe("AIA Issue", () => {
    let tempDir: string
    let eventsPath: string

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "junie-explorer-issue-test-"))
      eventsPath = path.join(tempDir, "events")
      await fs.ensureDir(eventsPath)
    })

    afterEach(async () => {
      await fs.remove(tempDir)
    })

    test("addTask adds a task to an AIA issue", async () => {
      // Create an AIA issue with initial task
      const eventFile1 = path.join(eventsPath, "task-1-events.jsonl")
      await fs.writeFile(eventFile1, "")
      const task1 = new Task("task-1", new Date(), eventFile1)
      const issue = new Issue("issue-1", new Date(), task1)

      // Create a second task
      const eventFile2 = path.join(eventsPath, "task-2-events.jsonl")
      await fs.writeFile(eventFile2, "")
      const task2 = new Task("task-2", new Date(), eventFile2)

      // Add the second task
      issue.addTask(task2)

      // Verify both tasks are present
      // Initial task key uses issue.id + ' 0', added tasks use task.id (which already has ' 0')
      const tasks = await issue.tasks
      expect(tasks.size).toBe(2)
      expect(tasks.has("issue-1 0")).toBe(true)
      expect(tasks.has("task-2 0")).toBe(true)
    })

    test("addTask does not reload tasks from disk", async () => {
      // Create an AIA issue with initial task
      const eventFile1 = path.join(eventsPath, "task-1-events.jsonl")
      await fs.writeFile(eventFile1, "")
      const task1 = new Task("task-1", new Date(), eventFile1)
      const issue = new Issue("task-1", new Date(), task1)

      // Access tasks to ensure they're loaded
      const initialTasks = await issue.tasks
      expect(initialTasks.size).toBe(1)

      // Create and add a second task
      const eventFile2 = path.join(eventsPath, "task-2-events.jsonl")
      await fs.writeFile(eventFile2, "")
      const task2 = new Task("task-2", new Date(), eventFile2)
      issue.addTask(task2)

      // Verify tasks are still in memory (not reloaded from disk)
      const tasksAfterAdd = await issue.tasks
      expect(tasksAfterAdd.size).toBe(2)
    })

    test("invalidateMetrics clears cached metrics", async () => {
      // Create an AIA issue with initial task
      const eventFile1 = path.join(eventsPath, "task-1-events.jsonl")
      await fs.writeFile(eventFile1, "")
      const task1 = new Task("task-1", new Date(), eventFile1)
      const issue = new Issue("task-1", new Date(), task1)

      // Access metrics to cache them
      const metrics1 = await issue.metrics
      expect(metrics1).toBeDefined()

      // Invalidate metrics
      issue.invalidateMetrics()

      // Access metrics again - should be recalculated
      const metrics2 = await issue.metrics
      expect(metrics2).toBeDefined()
    })

    test("tasks getter does not reload from disk when tasks already exist", async () => {
      // Create an AIA issue with initial task
      const eventFile1 = path.join(eventsPath, "task-1-events.jsonl")
      await fs.writeFile(eventFile1, "")
      const task1 = new Task("task-1", new Date(), eventFile1)
      const issue = new Issue("task-1", new Date(), task1)

      // Access tasks multiple times
      const tasks1 = await issue.tasks
      const tasks2 = await issue.tasks

      // Should be the same reference (not reloaded)
      expect(tasks1).toBe(tasks2)
      expect(tasks1.size).toBe(1)
    })
  })
})
