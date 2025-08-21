import { WorkerPoolError } from "./WorkerPoolError.js"

export class WorkerExecutionError extends WorkerPoolError {
  constructor(message: string, cause?: any) {
    super(message, cause)
    this.name = 'WorkerExecutionError'
  }
}