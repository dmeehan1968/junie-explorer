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
})
