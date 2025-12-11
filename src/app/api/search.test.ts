import { describe, expect, test, beforeAll, afterAll } from "bun:test"
import { Server } from "http"
import { AddressInfo } from "net"
import { createServer } from "../../createServer"

describe("Search API", () => {
  let server: Server
  let baseUrl: string

  beforeAll(async () => {
    process.env.CONCURRENCY = '10'
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
    expect(result.error).toContain("not found")
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

  describe("Regex search", () => {
    test("accepts regex parameter", async () => {
      const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
      if (projects.length === 0) {
        console.log("No projects available, skipping test")
        return
      }

      const projectName = encodeURIComponent(projects[0].name)
      const response = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=test&regex=true`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toHaveProperty("query")
      expect(result).toHaveProperty("regex", true)
      expect(result).toHaveProperty("matchingIssueIds")
    })

    test("performs regex search when regex=true", async () => {
      const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
      if (projects.length === 0) {
        console.log("No projects available, skipping test")
        return
      }

      const projectName = encodeURIComponent(projects[0].name)
      // Search for UUID pattern using regex
      const response = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=[a-f0-9]{8}-[a-f0-9]{4}&regex=true`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.regex).toBe(true)
    }, 30000)

    test("returns error for invalid regex pattern", async () => {
      const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
      if (projects.length === 0) {
        console.log("No projects available, skipping test")
        return
      }

      const projectName = encodeURIComponent(projects[0].name)
      // Invalid regex pattern (unclosed bracket)
      const response = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=[invalid&regex=true`)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toHaveProperty("error")
      expect(result.error).toContain("Invalid regex")
    })

    test("regex search is case-insensitive by default", async () => {
      const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
      if (projects.length === 0) {
        console.log("No projects available, skipping test")
        return
      }

      const projectName = encodeURIComponent(projects[0].name)

      const lowerResponse = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=test&regex=true`)
      const upperResponse = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=TEST&regex=true`)

      const lowerResult = await lowerResponse.json()
      const upperResult = await upperResponse.json()

      expect(lowerResult.matchingIssueIds.sort()).toEqual(upperResult.matchingIssueIds.sort())
    }, 30000)

    test("regex=false performs normal string search", async () => {
      const projects = await fetch(`${baseUrl}/api/projects`).then(r => r.json())
      if (projects.length === 0) {
        console.log("No projects available, skipping test")
        return
      }

      const projectName = encodeURIComponent(projects[0].name)
      const response = await fetch(`${baseUrl}/api/projects/${projectName}/search?q=test&regex=false`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.regex).toBe(false)
    })
  })
})
