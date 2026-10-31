import { expect, test } from "bun:test"
import { title } from "../src/session-title"

test("short messages still produce a title", () => {
  expect(title("hi")).toBe("hi")
})
