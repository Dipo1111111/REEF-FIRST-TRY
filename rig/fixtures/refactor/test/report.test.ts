import { expect, test } from "bun:test"
import { report } from "../src/report"

test("reports", () => {
  expect(report({ id: "a", steps: 2 })).toBe("a:2")
})
