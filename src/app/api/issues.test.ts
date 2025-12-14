import { describe, expect, test, beforeAll, afterAll, beforeEach } from "bun:test"
import { Server } from "http"
import { AddressInfo } from "net"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"
import { createServer } from "../../createServer"

describe("Issues API", () => {
  let server: Server
  let baseUrl: string
  let tempDir: string

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "junie-explorer-api-test-"))
    const { app } = await createServer({
      port: 0,
      concurrency: 10,
      jetBrainsLogPath: "./fixtures",
      homeDir: tempDir
    })
    server = app.listen(0)
    const address = server.address() as AddressInfo
    baseUrl = `http://localhost:${address.port}`
  }, 120000)

  afterAll(async () => {
    server?.close()
    await fs.remove(tempDir)
  })

  beforeEach(async () => {
    const issuesJsonPath = path.join(tempDir, ".junie-explorer", "issues.json")
    if (await fs.pathExists(issuesJsonPath)) {
      await fs.remove(issuesJsonPath)
    }
  })

  describe("PUT /api/issues/:issueId/description", () => {
    test("updates issue description", async () => {
      const response = await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "New description" })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.description).toBe("New description")
    })

    test("trims description before saving", async () => {
      const response = await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "  Trimmed description  " })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.description).toBe("Trimmed description")
    })

    test("removes description when empty after trimming", async () => {
      // First set a description
      await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Initial description" })
      })

      // Then clear it
      const response = await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "   " })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.description).toBeUndefined()
    })

    test("removes description when it matches originalName", async () => {
      const originalName = "Original Issue Name"

      // First set a custom description
      await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Custom description", originalName })
      })

      // Then set it back to the original name
      const response = await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: originalName, originalName })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.description).toBeUndefined()
    })

    test("keeps description when it differs from originalName", async () => {
      const originalName = "Original Issue Name"

      const response = await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Custom description", originalName })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.description).toBe("Custom description")
    })

    test("returns 400 when description is missing", async () => {
      const response = await fetch(`${baseUrl}/api/issues/test-issue-123/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.error).toBeDefined()
    })

    test("persists description to issues.json", async () => {
      await fetch(`${baseUrl}/api/issues/test-issue-456/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Persisted description" })
      })

      const issuesJsonPath = path.join(tempDir, ".junie-explorer", "issues.json")
      const data = await fs.readJson(issuesJsonPath)
      expect(data.descriptions["test-issue-456"]).toBe("Persisted description")
    })
  })

  describe("GET /api/issues/:issueId/description", () => {
    test("returns custom description when set", async () => {
      // First set a description
      await fetch(`${baseUrl}/api/issues/test-issue-789/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Custom description" })
      })

      const response = await fetch(`${baseUrl}/api/issues/test-issue-789/description`)
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.description).toBe("Custom description")
    })

    test("returns undefined when no custom description exists", async () => {
      const response = await fetch(`${baseUrl}/api/issues/non-existent-issue/description`)
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.description).toBeUndefined()
    })
  })

  describe("POST /api/projects/:projectName/issues/:issueId/unmerge", () => {
    const projectName = "aia-only-test"
    const issueId1 = "aaaaaaaa-1111-4111-8111-111111111111 0"
    const issueId2 = "bbbbbbbb-2222-4222-8222-222222222222 0"

    test("returns 404 when project not found", async () => {
      const response = await fetch(`${baseUrl}/api/projects/non-existent-project/issues/${issueId1}/unmerge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.error).toBe("Project not found")
    })

    test("returns 404 when issue not found", async () => {
      const response = await fetch(`${baseUrl}/api/projects/${projectName}/issues/non-existent-issue/unmerge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.error).toBe("Issue not found")
    })

    test("returns 400 when issue has only one task", async () => {
      const response = await fetch(`${baseUrl}/api/projects/${projectName}/issues/${issueId1}/unmerge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.error).toBe("Issue has only one task and cannot be unmerged")
    })

    test("unmerges a merged issue into individual issues", async () => {
      // First merge the two issues
      const mergeResponse = await fetch(`${baseUrl}/api/projects/${projectName}/issues/${issueId1}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIssueId: issueId2 })
      })
      expect(mergeResponse.status).toBe(200)
      const mergeResult = await mergeResponse.json()
      expect(mergeResult.mergedTaskCount).toBe(2)

      // Now unmerge
      const unmergeResponse = await fetch(`${baseUrl}/api/projects/${projectName}/issues/${issueId1}/unmerge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      expect(unmergeResponse.status).toBe(200)
      const unmergeResult = await unmergeResponse.json()
      expect(unmergeResult.success).toBe(true)
      expect(unmergeResult.unmergedTaskIds.length).toBe(2)
    })
  })
})
