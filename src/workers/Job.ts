/**
 * Represents a job to be executed by a worker
 */
export type Job<TIn, TOut> = {
  data: TIn
  resolve: (value: TOut) => void
  reject: (reason?: any) => void
  enqueuedAt: Date
}