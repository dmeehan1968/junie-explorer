import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { Task } from './Task'

const tmpRoot = path.join(os.tmpdir(), `junie-explorer-task-tests-${Date.now()}`)
const projectDir = path.join(tmpRoot, 'project')
const cacheDir = path.join(projectDir, 'Library', 'Caches', 'JetBrains')
const taskLogDir = path.join(cacheDir, 'task')

// Minimal JunieTask file to satisfy Task.load()
const junieTaskJson = {
  id: { index: 1 },
  created: '2024-01-01T00:00:00.000Z',
  artifactPath: 'artifact-1',
  context: { type: 'CHAT', description: 'desc' },
  isDeclined: false,
  plan: [],
}

describe('Task.loadEvents logging', () => {
  beforeAll(async () => {
    Task.setConfiguredConcurrency(0)
    await fs.mkdirp(taskLogDir)
    await fs.writeJson(path.join(taskLogDir, 'task.json'), junieTaskJson, { spaces: 2 })
  })

  afterAll(async () => {
    await fs.remove(tmpRoot)
    Task.setConfiguredConcurrency(undefined)
  })

  it('logs EventParserError entries and returns only valid events', async () => {
    const t = Task.fromJunieTask(path.join(taskLogDir, 'task.json'))
    // Write events to the exact file path Task expects
    const eventsFile = (t as any).eventsFile as string
    await fs.mkdirp(path.dirname(eventsFile))
    const lines = [
      JSON.stringify({ event: { type: 'McpInitStarted' }, timestampMs: '2024-01-01T00:00:00.000Z' }),
      '{bad json',
      JSON.stringify({ event: { type: 'UnknownType' }, timestampMs: '2024-01-01T00:00:01.000Z' }),
    ]
    await fs.writeFile(eventsFile, lines.join('\n'), 'utf-8')
    expect(await fs.pathExists(eventsFile)).toBeTrue()
    const originalLog = console.log
    const logs: any[] = []
    console.log = mock((...args: any[]) => { logs.push(args) }) as any
    try {
      const events = await (t as any).loadEvents()
      expect(Array.isArray(events)).toBeTrue()
      expect(events.length).toBe(1)
      expect(events[0].event.type).toBe('McpInitStarted')

      const errorLogs = logs.filter(args => args[0] === 'EventParserError')
      expect(errorLogs.length).toBe(2)
      // Validate structure of the inspected error payload
      for (const [, inspected] of errorLogs) {
        expect(typeof inspected).toBe('string')
        expect(inspected).toContain('eventsFile')
        expect(inspected).toContain('lineNumber')
        expect(inspected).toContain('message')
        expect(inspected).toContain('path')
        expect(inspected).toContain('json')
      }
    } finally {
      console.log = originalLog
    }
  })
})
