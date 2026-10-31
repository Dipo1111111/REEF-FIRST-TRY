import { expect, test } from "bun:test"
import { cost } from "../src/cost"

test("rounds to six decimal places", () => {
  expect(cost(1, 1, 0.1, 0.2)).toBe(0.3)
})
