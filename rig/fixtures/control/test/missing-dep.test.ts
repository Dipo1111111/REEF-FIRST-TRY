import { expect, test } from "bun:test"
import leftPad from "left-pad"

test("one call cannot produce two different paddings", () => {
  const value = leftPad("x", 3)
  expect(value).toBe("  x")
  expect(value).toBe("x  ")
})
