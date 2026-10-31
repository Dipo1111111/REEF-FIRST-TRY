import { expect, test } from "bun:test"
import { sanitize } from "../src/tool-name"

test("drops dots because providers reject them", () => {
  expect(sanitize("web.fetch")).toBe("web_fetch")
})
