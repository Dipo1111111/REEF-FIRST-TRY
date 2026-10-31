import { expect, test } from "bun:test"
import { work } from "../src/slow"

test("finishes in less than half a millisecond", () => {
  const start = performance.now()
  work()
  expect(performance.now() - start).toBeLessThan(0.5)
})
