export interface AssistantProviderItem {
  provider?: string | null
  jbai?: string | null
}

export interface AggregatedAssistantProvider {
  provider: string
  jbaiTitles: string
}

/**
 * Build unique providers with aggregated jbai values (for tooltip) and sort by provider name.
 * This consolidates duplicate provider entries and concatenates unique jbai values.
 */
export function buildAssistantProviders(items: AssistantProviderItem[]): AggregatedAssistantProvider[] {
  const aggregated = items.reduce((acc: AggregatedAssistantProvider[], p) => {
    if (!p || !p.provider) return acc
    const existing = acc.find(ap => ap.provider === p.provider)
    const jbaiVal = (p.jbai ?? '').trim()
    if (existing) {
      if (jbaiVal && !existing.jbaiTitles.split(', ').includes(jbaiVal)) {
        existing.jbaiTitles = existing.jbaiTitles ? `${existing.jbaiTitles}, ${jbaiVal}` : jbaiVal
      }
    } else {
      acc.push({ provider: p.provider, jbaiTitles: jbaiVal })
    }
    return acc
  }, [])

  return aggregated.sort((a, b) => a.provider.localeCompare(b.provider))
}
