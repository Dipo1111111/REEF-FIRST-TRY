import { expect, test } from "bun:test"
import { delay } from "../src/retry"

test("delay grows with every attempt", () => {
  const values = [0, 1, 2, 3, 4, 5].map((attempt) => delay(attempt))
  for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1])
})
