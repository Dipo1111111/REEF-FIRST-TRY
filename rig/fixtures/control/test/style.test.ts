import { expect, test } from "bun:test"
import { render } from "../src/style"

test("byte exact format that nobody was told", () => {
  expect(render()).toBe("\u001b[38;5;99mready\u001b[0m\n")
})
