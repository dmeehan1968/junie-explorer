import { WorkerFileIOStats } from '../stats/StatsTypes.js'

/**
 * Success response from worker
 */
interface Success<T> {
  ok: true
  result: T
  fileIOStats?: WorkerFileIOStats
}

/**
 * Failure response from worker
 */
export interface Failure {
  ok: false
  error: any
}

export type Response<T> = Success<T> | Failure