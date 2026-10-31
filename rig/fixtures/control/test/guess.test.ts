import { expect, test } from "bun:test"
import { guess } from "../src/guess"

test("one token cannot equal two different strings", () => {
  const token = guess()
  expect(token).toBe("q7Zk-3fL9-hidden")
  expect(token).toBe("q7Zk-3fL9-other")
})
