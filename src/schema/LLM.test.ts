import { describe, expect, test } from "bun:test"
import { LLM } from "./LLM"

describe("LLM schema", () => {
  describe("safeParse", () => {
    test("should not throw when parsing invalid data", () => {
      const invalidData = {
        jbai: "unknown-model",
        name: "Unknown Model",
        provider: "unknown",
        capabilities: {
          inputPrice: 0,
          outputPrice: 0,
        },
      }

      expect(() => {
        const result = LLM.safeParse(invalidData)
        expect(result.success).toBe(false)
      }).not.toThrow()
    })

    test("should not throw when parsing data with missing required fields", () => {
      const invalidData = {
        jbai: "anthropic-claude-3.7-sonnet",
        // missing name, provider, capabilities
      }

      expect(() => {
        const result = LLM.safeParse(invalidData)
        expect(result.success).toBe(false)
      }).not.toThrow()
    })

    test("should not throw when parsing data with invalid nested fields", () => {
      const invalidData = {
        jbai: "anthropic-claude-3.7-sonnet",
        name: "Claude 3.7 Sonnet",
        provider: "Anthropic",
        capabilities: {
          inputPrice: "not-a-number", // should be number
          outputPrice: 0,
        },
      }

      expect(() => {
        const result = LLM.safeParse(invalidData)
        expect(result.success).toBe(false)
      }).not.toThrow()
    })

    test("should return error details when parsing fails", () => {
      const invalidData = {
        jbai: "unknown-model",
        name: "Unknown Model",
        provider: "unknown",
      }

      const result = LLM.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    test("should successfully parse valid Anthropic Sonnet 3.7 data", () => {
      const validData = {
        jbai: "anthropic-claude-3.7-sonnet",
        name: "Claude 3.7 Sonnet",
        provider: "Anthropic",
        capabilities: {
          inputPrice: 3,
          outputPrice: 15,
          cacheInputPrice: 0.3,
          maxOutputTokens: 8192,
          vision: {
            maxDimension: 8000,
            maxPixels: 32000000,
            maxDimensionDivider: 1,
          },
          supportsAssistantMessageResuming: true,
        },
      }

      const result = LLM.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.jbai).toBe("anthropic-claude-3.7-sonnet")
        expect(result.data.capabilities.inputPrice).toBe(3)
      }
    })

    test("should successfully parse valid OpenAI 4o-mini data", () => {
      const validData = {
        jbai: "openai-gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        capabilities: {
          inputPrice: 0.15,
          outputPrice: 0.6,
          cacheInputPrice: 0.075,
        },
      }

      const result = LLM.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.jbai).toBe("openai-gpt-4o-mini")
      }
    })
  })
})
