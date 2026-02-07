import fs from "fs-extra"
import path from "node:path"

interface TaskIssueMapData {
  mappings?: Record<string, string>
  [key: string]: unknown
}

export class TaskIssueMapStore {
  private readonly jsonPath: string

  constructor(homeDir: string) {
    this.jsonPath = path.join(homeDir, ".junie-explorer", "taskIssueMap.json")
  }

  private async readData(): Promise<TaskIssueMapData> {
    try {
      if (await fs.pathExists(this.jsonPath)) {
        return await fs.readJson(this.jsonPath)
      }
    } catch {
      // If file is corrupted or unreadable, start fresh
    }
    return {}
  }

  private async writeData(data: TaskIssueMapData): Promise<void> {
    await fs.ensureDir(path.dirname(this.jsonPath))
    await fs.writeJson(this.jsonPath, data, { spaces: 2 })
  }

  async getIssueIdForTask(taskId: string): Promise<string | undefined> {
    const data = await this.readData()
    return data.mappings?.[taskId]
  }

  async setTaskIssueMapping(taskId: string, issueId: string): Promise<void> {
    const data = await this.readData()

    if (!data.mappings) {
      data.mappings = {}
    }

    data.mappings[taskId] = issueId

    await this.writeData(data)
  }

  async getMappingsForIssue(issueId: string): Promise<string[]> {
    const data = await this.readData()
    const mappings = data.mappings ?? {}

    return Object.entries(mappings)
      .filter(([_, mappedIssueId]) => mappedIssueId === issueId)
      .map(([taskId]) => taskId)
  }

  async removeMappings(taskIds: string[]): Promise<void> {
    const data = await this.readData()

    if (data.mappings) {
      let changed = false
      for (const taskId of taskIds) {
        if (taskId in data.mappings) {
          delete data.mappings[taskId]
          changed = true
        }
      }
      if (changed) {
        await this.writeData(data)
      }
    }
  }

  async getAllMappings(): Promise<Record<string, string>> {
    const data = await this.readData()
    return data.mappings ?? {}
  }
}
