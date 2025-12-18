import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { ChainIssueDiscoveryService } from "./ChainIssueDiscoveryService"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"

describe("ChainIssueDiscoveryService", () => {
  let tempDir: string
  let discoveryService: ChainIssueDiscoveryService

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "junie-explorer-chain-discovery-test-"))
    discoveryService = new ChainIssueDiscoveryService()
  })

  afterEach(async () => {
    await fs.remove(tempDir)
  })

  test("should discover standard issues from chain files", async () => {
    const logPath = path.join(tempDir, "project1")
    const issuesPath = path.join(logPath, "issues")
    await fs.ensureDir(issuesPath)

    const issueId = "aaaaaaaa-1111-4111-8111-111111111111"
    const issueData = {
      id: { id: issueId },
      name: "Test Issue",
      created: new Date().toISOString(),
      state: "Finished"
    }
    await fs.writeJson(path.join(issuesPath, `chain-${issueId}.json`), issueData)

    const issues = await discoveryService.discover([logPath])
    expect(issues.has(issueId)).toBe(true)
    expect(issues.get(issueId)?.name).toBe("Test Issue")
  })
})
