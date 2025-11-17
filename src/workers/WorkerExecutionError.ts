import { WorkerPoolError } from "./WorkerPoolError"

export class WorkerExecutionError extends WorkerPoolError {
  constructor(message: string, cause?: any) {
    super(message, cause)
    this.name = 'WorkerExecutionError'
  }
}