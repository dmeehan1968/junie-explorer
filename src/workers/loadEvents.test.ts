import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { loadEvents } from './loadEvents'

const tmpRoot = path.join(os.tmpdir(), `junie-explorer-tests-${Date.now()}`)
const eventsFile = path.join(tmpRoot, 'events.jsonl')

describe('workers/loadEvents', () => {
  beforeAll(async () => {
    await fs.mkdirp(tmpRoot)
    const lines = [
      // valid event
      JSON.stringify({ event: { type: 'McpInitStarted' }, timestampMs: '2024-01-01T00:00:00.000Z' }),
      // malformed JSON
      '{not json',
      // schema-invalid event (unknown type)
      JSON.stringify({ event: { type: 'UnknownType' }, timestampMs: '2024-01-01T00:00:00.000Z' }),
    ]
    await fs.writeFile(eventsFile, lines.join('\n'), 'utf-8')
  })

  afterAll(async () => {
    await fs.remove(tmpRoot)
  })

  it('returns valid events and collects errors for invalid lines', async () => {
    const { events, errors } = await loadEvents(eventsFile)

    expect(events.length).toBe(1)
    expect(events[0].event.type).toBe('McpInitStarted')

    expect(errors.length).toBe(2)
    // one JSON parse error and one schema error
    const messages = errors.map(e => e.message)
    expect(messages.some(m => m.includes('JSON parse error'))).toBeTrue()
    expect(messages.some(m => m.length > 0)).toBeTrue()
  })
})
