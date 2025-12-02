/**
 * Prunes circular reference properties from LLM events to prevent
 * excessively large object trees when serializing to JSON.
 *
 * Removes from the nested `event` property of EventRecord:
 * - `requestEvent` from LlmResponseEvent (links to the request)
 * - `previousRequest` from LlmRequestEvent (links to previous request in chain)
 */
export function pruneEventLinks<T>(events: T[]): T[] {
  return events.map(eventRecord => {
    if (eventRecord === null || typeof eventRecord !== 'object') {
      return eventRecord
    }

    const record = eventRecord as Record<string, unknown>

    // EventRecord has an `event` property containing the actual event
    if ('event' in record && record.event !== null && typeof record.event === 'object') {
      const event = { ...record.event } as Record<string, unknown>

      if ('requestEvent' in event) {
        delete event.requestEvent
      }

      if ('previousRequest' in event) {
        delete event.previousRequest
      }

      return { ...record, event } as T
    }

    return eventRecord
  })
}
