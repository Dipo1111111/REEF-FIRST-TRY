import { expect, test } from "bun:test"
import { total } from "../src/token-usage"

test("total counts reasoning tokens", () => {
  expect(total({ input: 10, output: 5, reasoning: 7, cache: { read: 3, write: 2 } })).toBe(27)
})
