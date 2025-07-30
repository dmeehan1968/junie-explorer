import { availableParallelism } from "poolifier-web-worker"

export function getMaxConcurrency() {
  return Math.min(availableParallelism(), parseInt(process.env.CONCURRENCY ?? availableParallelism().toString()))
}