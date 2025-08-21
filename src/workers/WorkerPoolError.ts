/**
 * Custom error types for WorkerPool
 */
export class WorkerPoolError extends Error {
  constructor(message: string, public cause?: any) {
    super(message)
    this.name = 'WorkerPoolError'
  }
}