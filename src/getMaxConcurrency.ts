export function getMaxConcurrency() {
  const { hardwareConcurrency } = navigator
  if (process.env.CONCURRENCY === undefined) {
    return 0
  }
  const env = parseInt(process.env.CONCURRENCY)
  const configured = Number.isFinite(env) && env >= 0 ? env : hardwareConcurrency
  return Math.min(hardwareConcurrency, configured)
}