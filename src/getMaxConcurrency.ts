import { availableParallelism } from "@poolifier/poolifier-web-worker"

export function getMaxConcurrency() {
  return Math.min(availableParallelism(), parseInt(process.env.CONCURRENCY ?? availableParallelism().toString()))
}