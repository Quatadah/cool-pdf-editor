import { describe, expect, it } from "vitest"

import { PaperSoundEngine } from "./paper-sound"

describe("PaperSoundEngine", () => {
  it("stays a safe no-op during server rendering", async () => {
    const engine = new PaperSoundEngine()

    await expect(engine.prime()).resolves.toBeUndefined()
    expect(() => engine.playRustle()).not.toThrow()
    expect(() => engine.playSettle()).not.toThrow()
    await expect(engine.close()).resolves.toBeUndefined()
  })
})
