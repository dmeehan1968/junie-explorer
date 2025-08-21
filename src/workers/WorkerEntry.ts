/**
 * Represents a worker instance with metadata
 */
export interface WorkerEntry {
  worker: Worker
  timer?: NodeJS.Timeout
  createdAt: Date
  id: string
}