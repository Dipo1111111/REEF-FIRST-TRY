import { expect, test } from "bun:test"
import { guess } from "../src/guess"

test("returns a token that is never specified", () => {
  expect(guess()).toBe("q7Zk-3fL9-hidden")
})
