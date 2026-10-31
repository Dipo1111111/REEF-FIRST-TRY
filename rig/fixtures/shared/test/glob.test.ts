import { expect, test } from "bun:test"
import { excluded } from "../src/glob"

test("dot directories are matched exactly, not by prefix", () => {
  expect(excluded("src/.github/workflow.yml", [".git"])).toBe(false)
  expect(excluded("src/.git/config", [".git"])).toBe(true)
})
