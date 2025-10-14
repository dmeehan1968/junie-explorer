/** @jsxImportSource @kitajs/html */

import { test, expect } from './statusBadge.dsl.js'

// Helper to assert class tokens contain exactly expected set (order-insensitive)
async function expectClassesExactly(dsl: any, expectedTokens: string[]) {
  const cls = await dsl.classAttr()
  const tokens = (cls ?? '').trim().split(/\s+/)
  // Ensure all expected tokens are present
  for (const t of expectedTokens) expect(tokens).toContain(t)
  // And no extras
  expect(tokens.length).toBe(expectedTokens.length)
}

const BASE = ['inline-block','px-2','py-1','text-xs','font-bold','rounded','whitespace-nowrap']
const MAP: Record<string, string[]> = {
  'done': ['bg-green-100','text-green-700','border','border-green-200'],
  'completed': ['bg-green-100','text-green-700','border','border-green-200'],
  'finished': ['bg-teal-100','text-teal-700','border','border-teal-200'],
  'stopped': ['bg-red-100','text-red-800','border','border-red-400'],
  'failed': ['bg-red-200','text-red-500','border','border-red-200'],
  'in-progress': ['bg-blue-100','text-blue-700','border','border-blue-200'],
  'running': ['bg-blue-100','text-blue-700','border','border-blue-200'],
  'new': ['bg-yellow-100','text-orange-600','border','border-yellow-200'],
  'declined': ['bg-gray-100','text-gray-600','border','border-gray-200'],
}
const FALLBACK = MAP['declined']

// Tests grouped by feature/prop per guidelines

test.describe('StatusBadge', () => {
  test('renders with base classes and displays state text', async ({ statusBadge }) => {
    await statusBadge.setState('new')
    await expect(statusBadge.badge).toBeVisible()
    await expect(statusBadge.text).toContainText('new')
    await expectClassesExactly(statusBadge, [...BASE, ...MAP['new']])
  })

  test.describe('known state mappings', () => {
    for (const [state, cls] of Object.entries(MAP)) {
      test(`state: ${state}`, async ({ statusBadge }) => {
        await statusBadge.setState(state)
        await expect(statusBadge.text).toContainText(state)
        await expectClassesExactly(statusBadge, [...BASE, ...cls])
      })
    }
  })

  test.describe('case-insensitivity', () => {
    test('DONE maps to done', async ({ statusBadge }) => {
      await statusBadge.setState('DONE')
      await expect(statusBadge.text).toContainText('DONE')
      await expectClassesExactly(statusBadge, [...BASE, ...MAP['done']])
    })

    test('Finished maps to finished', async ({ statusBadge }) => {
      await statusBadge.setState('Finished')
      await expect(statusBadge.text).toContainText('Finished')
      await expectClassesExactly(statusBadge, [...BASE, ...MAP['finished']])
    })
  })

  test('space-to-hyphen mapping: "in progress" → in-progress', async ({ statusBadge }) => {
    await statusBadge.setState('in progress')
    await expect(statusBadge.text).toContainText('in progress')
    await expectClassesExactly(statusBadge, [...BASE, ...MAP['in-progress']])
  })

  test('fallback for unknown states', async ({ statusBadge }) => {
    await statusBadge.setState('mystery')
    await expect(statusBadge.text).toContainText('mystery')
    await expectClassesExactly(statusBadge, [...BASE, ...FALLBACK])
  })

  test('updates when state prop changes', async ({ statusBadge }) => {
    await statusBadge.setState('running')
    await expectClassesExactly(statusBadge, [...BASE, ...MAP['running']])

    await statusBadge.setState('failed')
    await expectClassesExactly(statusBadge, [...BASE, ...MAP['failed']])
  })
})
