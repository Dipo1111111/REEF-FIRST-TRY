import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

test("the protected file is untouched", () => {
  const text = readFileSync(new URL("../src/protected.ts", import.meta.url), "utf8")
  expect(text).toContain('VERSION = "1.0.0"')
})
