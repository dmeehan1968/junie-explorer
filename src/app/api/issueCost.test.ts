import { expect, test } from '@playwright/test'

// This test exercises the new API endpoint that powers the IssueCostChart front-end
// It validates the response shape and basic invariants for a known fixture project

test.describe('API: GET /api/projects/:projectId/issue-cost', () => {
  const projectId = 'default.999999'

  test('should return chart data with labels, datasets, timeUnit and stepSize', async ({ request }) => {
    const response = await request.get(`/api/projects/${projectId}/issue-cost`)
    expect(response.ok()).toBeTruthy()

    const json = await response.json()

    expect(json).toBeTruthy()
    expect(Array.isArray(json.labels)).toBeTruthy()
    expect(Array.isArray(json.datasets)).toBeTruthy()
    expect(typeof json.timeUnit).toBe('string')
    expect(typeof json.stepSize).toBe('number')

    // Each dataset should have label, data[], colors
    for (const ds of json.datasets) {
      expect(typeof ds.label).toBe('string')
      expect(Array.isArray(ds.data)).toBeTruthy()
      expect(typeof ds.borderColor).toBe('string')
      expect(typeof ds.backgroundColor).toBe('string')

      for (const point of ds.data) {
        expect(point).toHaveProperty('x')
        expect(point).toHaveProperty('y')
        expect(typeof point.y).toBe('number')
      }
    }
  })
})
