import { Issue } from "../Issue"
import { TaskIssueMapStore } from "./TaskIssueMapStore"
import { IssueDiscoveryService } from "./IssueDiscoveryService"
import { ChainIssueDiscoveryService } from "./ChainIssueDiscoveryService"
import { AiaIssueDiscoveryService } from "./AiaIssueDiscoveryService"

export class CompositeIssueDiscoveryService implements IssueDiscoveryService {
  private readonly services: IssueDiscoveryService[]

  constructor(taskIssueMapStore?: TaskIssueMapStore) {
    this.services = [
      new ChainIssueDiscoveryService(),
      new AiaIssueDiscoveryService(taskIssueMapStore)
    ]
  }

  async discover(logPaths: string[]): Promise<Map<string, Issue>> {
    const allIssues = new Map<string, Issue>()

    for (const service of this.services) {
      const issues = await service.discover(logPaths)
      for (const [id, issue] of issues) {
        allIssues.set(id, issue)
      }
    }

    return allIssues
  }
}
