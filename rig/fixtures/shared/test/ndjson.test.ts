import { expect, test } from "bun:test"
import { encode } from "../src/ndjson"

test("one parseable JSON object per line even with newlines in text", () => {
  const output = encode([{ type: "text", text: "line one\nline two" }])
  const lines = output.split("\n")
  expect(lines.length).toBe(1)
  expect(JSON.parse(lines[0])).toEqual({ type: "text", text: "line one\nline two" })
})
