import { expect, test } from "bun:test"
import { render } from "../src/style"

test("one output cannot equal two different strings", () => {
  const output = render()
  expect(output).toBe("\u001b[38;5;99mready\u001b[0m\n")
  expect(output).toBe("ready")
})
