import { Issue } from "../Issue"

export interface IssueDiscoveryService {
  discover(logPaths: string[]): Promise<Map<string, Issue>>
}
