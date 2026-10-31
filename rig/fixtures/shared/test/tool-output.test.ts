import { expect, test } from "bun:test"
import { truncate } from "../src/tool-output"

test("keeps the full window before the notice", () => {
  const result = truncate(["a", "b", "c", "d"], 3)
  expect(result).toBe("a\nb\nc\n...")
})
