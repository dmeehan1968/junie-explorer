import { Job } from "./Job"

/**
 * Manages job queuing and scheduling
 */
export class JobScheduler<TIn extends object, TOut extends object> {
  private queue: Job<TIn, TOut>[] = []

  /**
   * Adds a job to the queue
   */
  enqueue(job: Job<TIn, TOut>): void {
    this.queue.push(job)
  }

  /**
   * Removes and returns the next job from the queue
   */
  dequeue(): Job<TIn, TOut> | undefined {
    return this.queue.shift()
  }

  /**
   * Returns the number of queued jobs
   */
  get queuedCount(): number {
    return this.queue.length
  }

  /**
   * Clears all queued jobs
   */
  clear(): void {
    this.queue.splice(0)
  }

  /**
   * Returns true if there are jobs waiting to be processed
   */
  hasJobs(): boolean {
    return this.queue.length > 0
  }
}