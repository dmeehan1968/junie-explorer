export function getMaxConcurrency(configuredConcurrency?: number) {
  const { hardwareConcurrency } = navigator
  if (configuredConcurrency === undefined) {
    return 0
  }

  const configured =
    Number.isFinite(configuredConcurrency) && configuredConcurrency >= 0
      ? configuredConcurrency
      : hardwareConcurrency

  return Math.min(hardwareConcurrency, configured)
}