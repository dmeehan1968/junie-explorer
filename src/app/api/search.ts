import express from "express"
import { Project } from "../../Project"
import { Issue } from "../../Issue"
import { isRequestEvent } from "../../schema/llmRequestEvent"
import { isResponseEvent } from "../../schema/llmResponseEvent"
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware"
import { AppRequest, AppResponse } from "../types"

const router = express.Router()

router.use('/api/projects/:projectId/search', entityLookupMiddleware)

export interface SearchResult {
  query: string
  regex: boolean
  matchingIssueIds: string[]
  totalIssues: number
  matchCount: number
}

function createMatcher(query: string, useRegex: boolean): (text: string) => boolean {
  if (useRegex) {
    const regex = new RegExp(query, 'i')
    return (text: string) => regex.test(text)
  } else {
    const lowerQuery = query.toLowerCase()
    return (text: string) => text.toLowerCase().includes(lowerQuery)
  }
}

async function searchIssueEvents(issue: Issue, query: string, useRegex: boolean): Promise<boolean> {
  const matches = createMatcher(query, useRegex)

  if (matches(issue.id)) {
    return true
  }

  const tasks = await issue.tasks

  const taskPromises = Array.from(tasks.values()).map(async (task) => {
    const events = await task.events

    for (const eventRecord of events) {
      const event = eventRecord.event

      // make sure to be selective about what is searched, as stringify can be expensive

      if (isRequestEvent(event)) {
        if (matches(event.id) || matches(JSON.stringify(event.chat.messages))) {
          return true
        }
      }

      if (isResponseEvent(event)) {
        if (matches(event.id) || matches(JSON.stringify(event.answer.contentChoices))) {
          return true
        }
      }
    }

    return false
  })

  const results = await Promise.all(taskPromises)

  return results.some(result => result === true);

}

router.get('/api/projects/:projectId/search', async (req: AppRequest, res: AppResponse) => {
  try {
    const { q, regex } = req.query as { q?: string, regex?: string }
    const useRegex = regex === 'true'

    if (!q || q.trim() === '') {
      return res.json({
        query: '',
        regex: useRegex,
        matchingIssueIds: [],
        totalIssues: 0,
        matchCount: 0,
      } satisfies SearchResult)
    }

    const project = req.project

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Validate regex pattern if regex mode is enabled
    if (useRegex) {
      try {
        new RegExp(q.trim(), 'i')
      } catch {
        return res.status(400).json({ error: `Invalid regex pattern: ${q.trim()}` })
      }
    }

    const issues = [...(await project.issues).values()]
    const totalIssues = issues.length

    const searchPromises = issues.map(async (issue) => {
      const matches = await searchIssueEvents(issue, q.trim(), useRegex)
      return matches ? issue.id : null
    })

    const results = await Promise.all(searchPromises)
    const matchingIssueIds = results.filter((id): id is string => id !== null)

    res.json({
      query: q.trim(),
      regex: useRegex,
      matchingIssueIds,
      totalIssues,
      matchCount: matchingIssueIds.length,
    } satisfies SearchResult)
  } catch (error) {
    console.error('Error searching issues:', error)
    res.status(500).json({ error: 'An error occurred while searching issues' })
  }
})

export default router
