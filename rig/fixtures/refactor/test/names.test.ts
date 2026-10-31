import { expect, test } from "bun:test"
import { makeRun } from "../src/names"

test("makes a run", () => {
  expect(makeRun("a", 1)).toEqual({ id: "a", steps: 1 })
})
