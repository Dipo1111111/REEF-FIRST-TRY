import { expect, test } from "bun:test"
import leftPad from "left-pad"

test("uses a package that is not installed", () => {
  expect(leftPad("x", 3)).toBe("  x")
})
