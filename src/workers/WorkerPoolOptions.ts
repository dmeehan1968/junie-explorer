import { WorkerPoolError } from "./WorkerPoolError.js"
import { WorkerFileIOStats } from "../stats/StatsTypes.js"

/**
 * Configuration options for WorkerPool
 */
export interface WorkerPoolOptions {
  /** Minimum number of workers to keep alive */
  minConcurrency: number
  /** Maximum number of workers to spawn */
  maxConcurrency: number
  /** Path to the worker script */
  workerPath: string
  /** Time in milliseconds before idle workers are terminated */
  idleTimeoutMs?: number
  /** Handler for worker errors */
  errorHandler?: (e: WorkerPoolError) => void
  /** Human-friendly name for the pool */
  name?: string
  /** Handler for file I/O statistics from workers */
  onFileIOStats?: (stats: WorkerFileIOStats) => void
}