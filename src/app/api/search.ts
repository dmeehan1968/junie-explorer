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
  matchingIssueIds: string[]
  totalIssues: number
  matchCount: number
}

async function searchIssueEvents(issue: Issue, query: string): Promise<boolean> {
  const lowerQuery = query.toLowerCase()

  if (issue.id.toLowerCase().includes(lowerQuery)) {
    return true
  }

  // const start = Date.now()

  const tasks = await issue.tasks

  const taskPromises = Array.from(tasks.values()).map(async (task) => {
    const events = await task.events

    for (const eventRecord of events) {
      const event = eventRecord.event

      // make sure to be selective about what is searched, as stringify can be expensive

      if (isRequestEvent(event)) {
        if (event.id.includes(lowerQuery) || JSON.stringify(event.chat.messages).includes(lowerQuery)) {
          return true
        }
      }

      if (isResponseEvent(event)) {
        if (event.id.includes(lowerQuery) || JSON.stringify(event.answer.contentChoices).includes(lowerQuery)) {
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
    const { q } = req.query as { q?: string }

    if (!q || q.trim() === '') {
      return res.json({
        query: '',
        matchingIssueIds: [],
        totalIssues: 0,
        matchCount: 0,
      } satisfies SearchResult)
    }

    const project = req.project

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const issues = [...(await project.issues).values()]
    const totalIssues = issues.length

    const searchPromises = issues.map(async (issue) => {
      const matches = await searchIssueEvents(issue, q.trim())
      return matches ? issue.id : null
    })

    const results = await Promise.all(searchPromises)
    const matchingIssueIds = results.filter((id): id is string => id !== null)

    res.json({
      query: q.trim(),
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
