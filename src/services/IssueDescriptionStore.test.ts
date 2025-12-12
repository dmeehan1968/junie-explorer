import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { IssueDescriptionStore } from "./IssueDescriptionStore"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"

describe("IssueDescriptionStore", () => {
  let tempDir: string
  let store: IssueDescriptionStore

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "junie-explorer-test-"))
    store = new IssueDescriptionStore(tempDir)
  })

  afterEach(async () => {
    await fs.remove(tempDir)
  })

  describe("getDescription", () => {
    test("returns undefined when no custom description exists", async () => {
      const result = await store.getDescription("issue-123")
      expect(result).toBeUndefined()
    })

    test("returns the custom description when it exists", async () => {
      const issuesJsonPath = path.join(tempDir, ".junie-explorer", "issues.json")
      await fs.ensureDir(path.dirname(issuesJsonPath))
      await fs.writeJson(issuesJsonPath, {
        descriptions: {
          "issue-123": "Custom description"
        }
      })

      const result = await store.getDescription("issue-123")
      expect(result).toBe("Custom description")
    })
  })

  describe("setDescription", () => {
    test("saves a custom description", async () => {
      await store.setDescription("issue-123", "New description")

      const result = await store.getDescription("issue-123")
      expect(result).toBe("New description")
    })

    test("trims the description before saving", async () => {
      await store.setDescription("issue-123", "  Trimmed description  ")

      const result = await store.getDescription("issue-123")
      expect(result).toBe("Trimmed description")
    })

    test("removes the entry when trimmed description is empty", async () => {
      await store.setDescription("issue-123", "Initial description")
      await store.setDescription("issue-123", "   ")

      const result = await store.getDescription("issue-123")
      expect(result).toBeUndefined()
    })

    test("creates the .junie-explorer directory if it does not exist", async () => {
      await store.setDescription("issue-123", "New description")

      const dirExists = await fs.pathExists(path.join(tempDir, ".junie-explorer"))
      expect(dirExists).toBe(true)
    })

    test("preserves other data in issues.json", async () => {
      const issuesJsonPath = path.join(tempDir, ".junie-explorer", "issues.json")
      await fs.ensureDir(path.dirname(issuesJsonPath))
      await fs.writeJson(issuesJsonPath, {
        descriptions: {
          "other-issue": "Other description"
        },
        otherData: { key: "value" }
      })

      await store.setDescription("issue-123", "New description")

      const data = await fs.readJson(issuesJsonPath)
      expect(data.descriptions["other-issue"]).toBe("Other description")
      expect(data.otherData).toEqual({ key: "value" })
    })
  })

  describe("getAllDescriptions", () => {
    test("returns empty object when no descriptions exist", async () => {
      const result = await store.getAllDescriptions()
      expect(result).toEqual({})
    })

    test("returns all custom descriptions", async () => {
      await store.setDescription("issue-1", "Description 1")
      await store.setDescription("issue-2", "Description 2")

      const result = await store.getAllDescriptions()
      expect(result).toEqual({
        "issue-1": "Description 1",
        "issue-2": "Description 2"
      })
    })
  })
})
