import fs from "fs-extra"
import path from "node:path"
import { Issue } from "../Issue"
import { IssueDiscoveryService } from "./IssueDiscoveryService"

export class ChainIssueDiscoveryService implements IssueDiscoveryService {
  async discover(logPaths: string[]): Promise<Map<string, Issue>> {
    const issues = new Map<string, Issue>()

    for (const logPath of logPaths) {
      const root = path.join(logPath, 'issues')

      if (fs.existsSync(root)) {
        fs.globSync(path.join(root, 'chain-*.json'))
          .map(path => Issue.fromChainFile(path))
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(issue => issues.set(issue.id, issue))
      }
    }

    return issues
  }
}
