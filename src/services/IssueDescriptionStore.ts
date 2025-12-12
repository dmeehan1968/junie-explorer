import fs from "fs-extra"
import path from "node:path"

interface IssuesData {
  descriptions?: Record<string, string>
  [key: string]: unknown
}

export class IssueDescriptionStore {
  private readonly issuesJsonPath: string

  constructor(homeDir: string) {
    this.issuesJsonPath = path.join(homeDir, ".junie-explorer", "issues.json")
  }

  private async readData(): Promise<IssuesData> {
    try {
      if (await fs.pathExists(this.issuesJsonPath)) {
        return await fs.readJson(this.issuesJsonPath)
      }
    } catch {
      // If file is corrupted or unreadable, start fresh
    }
    return {}
  }

  private async writeData(data: IssuesData): Promise<void> {
    await fs.ensureDir(path.dirname(this.issuesJsonPath))
    await fs.writeJson(this.issuesJsonPath, data, { spaces: 2 })
  }

  async getDescription(issueId: string): Promise<string | undefined> {
    const data = await this.readData()
    return data.descriptions?.[issueId]
  }

  async setDescription(issueId: string, description: string): Promise<void> {
    const trimmed = description.trim()
    const data = await this.readData()

    if (!data.descriptions) {
      data.descriptions = {}
    }

    if (trimmed === "") {
      delete data.descriptions[issueId]
    } else {
      data.descriptions[issueId] = trimmed
    }

    await this.writeData(data)
  }

  async getAllDescriptions(): Promise<Record<string, string>> {
    const data = await this.readData()
    return data.descriptions ?? {}
  }
}
