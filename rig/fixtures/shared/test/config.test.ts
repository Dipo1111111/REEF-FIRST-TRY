import { expect, test } from "bun:test"
import { merge } from "../src/config"

test("later files win over earlier ones", () => {
  const result = merge([
    { order: 0, value: { model: "first" } },
    { order: 1, value: { model: "second" } },
  ])
  expect(result.model).toBe("second")
})
