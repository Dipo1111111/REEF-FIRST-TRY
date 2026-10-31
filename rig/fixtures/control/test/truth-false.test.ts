import { expect, test } from "bun:test"
import { value } from "../src/truth"

test("must be false", () => {
  expect(value()).toBe(false)
})
