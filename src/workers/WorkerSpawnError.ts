import { WorkerPoolError } from "./WorkerPoolError"

export class WorkerSpawnError extends WorkerPoolError {
  constructor(message: string, cause?: any) {
    super(message, cause)
    this.name = 'WorkerSpawnError'
  }
}