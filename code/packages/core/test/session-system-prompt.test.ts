import { expect, test } from "bun:test"
import { SessionSystemPrompt } from "@opencode/core/session/system-prompt"

test("renders the default system prompt instructions", () => {
  const prompt = SessionSystemPrompt.make(["edit", "read", "shell"])
  expect(prompt).not.toContain("${OPENCODE_TOOL_GUIDANCE}")
  expect(prompt).toContain("Use the edit tool for targeted changes to existing text files")
})

test("asks for one script instead of one call per step when execute is resident", () => {
  expect(SessionSystemPrompt.make(["execute", "question"])).toContain(
    "Prefer one `execute` script that makes many tool calls over many separate tool calls",
  )
  expect(SessionSystemPrompt.make(["read", "edit"])).not.toContain("Prefer one `execute` script")
})
