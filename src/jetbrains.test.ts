import { describe, test, expect } from "bun:test"
import { JetBrains } from "./jetbrains"
import { IssueDescriptionStore } from "./services/IssueDescriptionStore"

describe("JetBrains", () => {
  describe("issueDescriptionStore", () => {
    test("should have an issueDescriptionStore property", () => {
      const jetBrains = new JetBrains({ logPath: "fixtures" })
      
      expect(jetBrains.issueDescriptionStore).toBeDefined()
      expect(jetBrains.issueDescriptionStore).toBeInstanceOf(IssueDescriptionStore)
    })
  })
})
