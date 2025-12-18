import fs from "fs-extra"
import path from "node:path"
import { Issue, AiaIssue } from "../Issue"
import { Task } from "../Task"
import { TaskIssueMapStore } from "./TaskIssueMapStore"
import { IssueDiscoveryService } from "./IssueDiscoveryService"

export class AiaIssueDiscoveryService implements IssueDiscoveryService {
  constructor(private readonly taskIssueMapStore?: TaskIssueMapStore) {}

  async discover(logPaths: string[]): Promise<Map<string, Issue>> {
    const issues = new Map<string, Issue>()

    for (const logPath of logPaths) {
      const eventsPath = path.join(logPath, 'events')

      if (!fs.existsSync(eventsPath)) {
        continue
      }

      const eventsRegex = /(?<id>[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-events\.jsonl$/i

      const taskIssueMappings = this.taskIssueMapStore
        ? await this.taskIssueMapStore.getAllMappings()
        : {}

      const aiaTasksFiles = fs.globSync(path.join(eventsPath, '*-events.jsonl'))
      const aiaTasks = aiaTasksFiles
        .filter(filePath => eventsRegex.test(filePath))
        .map(filePath => {
          const created = fs.statSync(filePath).mtime
          const id = (filePath.match(eventsRegex)?.groups?.id ?? '')
          const task = Task.fromAiaTask(id, created, filePath)
          return { id: task.id, created, task }
        })

      const unmappedTasks = aiaTasks.filter(({ id }) => !taskIssueMappings[id])
      const mappedTasks = aiaTasks.filter(({ id }) => taskIssueMappings[id])

      for (const { id, created, task } of unmappedTasks) {
        if (!issues.has(id)) {
          issues.set(id, Issue.fromAia(id, created, task))
        }
      }

      for (const { id, task } of mappedTasks) {
        const targetIssueId = taskIssueMappings[id]
        const targetIssue = issues.get(targetIssueId)
        if (targetIssue && targetIssue instanceof AiaIssue) {
          targetIssue.addTask(task)
        } else {
          if (!issues.has(id)) {
            issues.set(id, Issue.fromAia(id, task.created, task))
          }
        }
      }
    }

    return issues
  }
}
