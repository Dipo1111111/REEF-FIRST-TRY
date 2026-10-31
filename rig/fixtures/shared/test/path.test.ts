import { expect, test } from "bun:test"
import { normalize } from "../src/path"

test("keeps a UNC prefix intact", () => {
  expect(normalize("\\\\server\\share\\file.txt")).toBe("//server/share/file.txt")
})
