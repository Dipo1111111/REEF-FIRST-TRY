import { expect, test } from "bun:test"

test("a monotonic clock cannot be negative", () => {
  expect(performance.now()).toBeLessThan(0)
})
