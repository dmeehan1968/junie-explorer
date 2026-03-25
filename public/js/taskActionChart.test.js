// @ts-nocheck
import { describe, test, expect } from "bun:test"

// Extract the pure logic from TaskActionChart for unit testing
function calculateTimeRange(actionPairs) {
  if (actionPairs.length === 0) {
    return { start: new Date(), end: new Date() }
  }

  const allTimes = []
  actionPairs.forEach(pair => {
    allTimes.push(pair.startTime.getTime())
    allTimes.push(pair.endTime.getTime())
  })

  const start = new Date(Math.min(...allTimes))
  const end = new Date(Math.max(...allTimes))

  const span = end.getTime() - start.getTime()
  const padding = span > 0 ? span * 0.05 : 500
  return {
    start: new Date(start.getTime() - padding),
    end: new Date(end.getTime() + padding)
  }
}

function timeToX(timestamp, timeRange, marginLeft, chartWidth) {
  const totalTime = timeRange.end.getTime() - timeRange.start.getTime()
  const elapsed = timestamp.getTime() - timeRange.start.getTime()
  return marginLeft + (elapsed / totalTime) * chartWidth
}

describe("TaskActionChart", () => {
  describe("calculateTimeRange", () => {
    test("returns non-zero range for a single zero-duration event", () => {
      const t = new Date("2024-01-01T10:00:00.000Z")
      const pairs = [{ startTime: t, endTime: t }]

      const range = calculateTimeRange(pairs)

      expect(range.end.getTime()).toBeGreaterThan(range.start.getTime())
    })

    test("timeToX produces a finite x position for a single zero-duration event", () => {
      const t = new Date("2024-01-01T10:00:00.000Z")
      const pairs = [{ startTime: t, endTime: t }]

      const range = calculateTimeRange(pairs)
      const x = timeToX(t, range, 500, 300)

      expect(isFinite(x)).toBe(true)
      expect(isNaN(x)).toBe(false)
    })
  })
})
