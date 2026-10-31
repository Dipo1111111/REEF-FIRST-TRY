import { expect, test } from "bun:test"
import { value } from "../src/truth"

test("must be true", () => {
  expect(value()).toBe(true)
})
