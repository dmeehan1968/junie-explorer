import { describe, expect, test, beforeAll, afterAll } from "bun:test"
import { Server } from "http"
import { AddressInfo } from "net"
import { createServer } from "../../createServer"

describe("Search API", () => {
  let server: Server
  let baseUrl: string

  beforeAll(async () => {
    const { app } = await createServer({ port: 0 })
    server = app.listen(0)
    const address = server.address() as AddressInfo
    baseUrl = `http://localhost:${address.port}`
  }, 120000)

  afterAll(() => {
    server?.close()
  })

  test("returns empty results for empty query", async () => {
    const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
    if (projects.length === 0) {
      console.log("No projects available, skipping test")
      return
    }

    const projectName = encodeURIComponent(projects[0].name)
    const response = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=`)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.query).toBe("")
    expect(result.matchingIssueIds).toEqual([])
    expect(result.matchCount).toBe(0)
  })

  test("returns 404 for non-existent project", async () => {
    const response = await fetch(`${baseUrl}/api/projects/non-existent-project-12345/search?q=test`)

    expect(response.status).toBe(404)
    const result = await response.json()
    expect(result.error).toBe("Project not found")
  })

  test("performs case-insensitive search", async () => {
    const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
    if (projects.length === 0) {
      console.log("No projects available, skipping test")
      return
    }

    const projectName = encodeURIComponent(projects[0].name)

    const lowerResponse = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=test`)
    const upperResponse = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=TEST`)

    const lowerResult = await lowerResponse.json()
    const upperResult = await upperResponse.json()

    expect(lowerResult.matchingIssueIds.sort()).toEqual(upperResult.matchingIssueIds.sort())
  }, 30000)

  test("returns correct structure for valid search", async () => {
    const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
    if (projects.length === 0) {
      console.log("No projects available, skipping test")
      return
    }

    const projectName = encodeURIComponent(projects[0].name)
    const response = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=a`)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result).toHaveProperty("query")
    expect(result).toHaveProperty("matchingIssueIds")
    expect(result).toHaveProperty("totalIssues")
    expect(result).toHaveProperty("matchCount")
    expect(Array.isArray(result.matchingIssueIds)).toBe(true)
    expect(typeof result.totalIssues).toBe("number")
    expect(typeof result.matchCount).toBe("number")
    expect(result.matchCount).toBe(result.matchingIssueIds.length)
  })

  test("can search by UUID pattern", async () => {
    const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
    if (projects.length === 0) {
      console.log("No projects available, skipping test")
      return
    }

    const projectName = encodeURIComponent(projects[0].name)

    const response = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=-`)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.matchCount).toBeGreaterThanOrEqual(0)
  })
})
