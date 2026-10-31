import { expect, test } from "bun:test"
import { advance } from "../src/pipeline"

test("advances", () => {
  expect(advance({ id: "a", steps: 1 }).steps).toBe(2)
})
