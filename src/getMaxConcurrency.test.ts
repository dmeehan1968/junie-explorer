import { describe, expect, test } from "bun:test"
import { getMaxConcurrency } from "./getMaxConcurrency"

describe("getMaxConcurrency", () => {
  test("does not read process.env.CONCURRENCY", () => {
    const previous = process.env.CONCURRENCY
    process.env.CONCURRENCY = "10"

    try {
      expect(getMaxConcurrency()).toBe(0)
    } finally {
      if (previous === undefined) {
        delete process.env.CONCURRENCY
      } else {
        process.env.CONCURRENCY = previous
      }
    }
  })
})
