import { expect, test } from "bun:test"
import { markers } from "../src/cache-policy"

test("never exceeds four cache markers", () => {
  expect(markers(10)).toBe(4)
})
