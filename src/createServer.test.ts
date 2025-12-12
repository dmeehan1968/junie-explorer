import { describe, expect, test } from "bun:test"
import os from "node:os"
import { JetBrains } from "./jetbrains"
import { createServer } from "./createServer"

describe("createServer", () => {
  test("does not read process.env for port default", async () => {
    const previousPort = process.env.PORT
    process.env.PORT = "12345"

    try {
      const { port } = await createServer({
        preload: false,
        jetBrainsInstance: new JetBrains({ logPath: "./fixtures" }),
        homeDir: os.tmpdir(),
      })

      expect(port).toBe(3000)
    } finally {
      if (previousPort === undefined) {
        delete process.env.PORT
      } else {
        process.env.PORT = previousPort
      }
    }
  })
})
