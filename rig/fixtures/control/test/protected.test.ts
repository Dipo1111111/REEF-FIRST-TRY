import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

test("a file cannot both contain and not contain the same text", () => {
  const text = readFileSync(new URL("../src/protected.ts", import.meta.url), "utf8")
  expect(text).toContain('VERSION = "1.0.0"')
  expect(text).not.toContain("VERSION")
})
