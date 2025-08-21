export function getMaxConcurrency() {
  const hw = navigator.hardwareConcurrency
  const env = parseInt(process.env.CONCURRENCY ?? hw.toString())
  const configured = Number.isFinite(env) && env > 0 ? env : hw
  return Math.min(hw, configured)
}