import { expect, test } from "bun:test"
import { SessionSystemPrompt } from "@opencode/core/session/system-prompt"

test("renders the default system prompt instructions", () => {
  const prompt = SessionSystemPrompt.make(["edit", "read", "shell"])
  expect(prompt).not.toContain("${OPENCODE_TOOL_GUIDANCE}")
  expect(prompt).toContain("Use the edit tool for targeted changes to existing text files")
})

test("batches mechanical work but not exploratory or visual work when execute is resident", () => {
  expect(SessionSystemPrompt.make(["execute", "question"])).toContain(
    "Batch mechanical work: many reads, greps, or edits of different files belong in one `execute` script",
  )
  expect(SessionSystemPrompt.make(["execute", "question"])).toContain(
    "Do not batch exploratory or visual work",
  )
  expect(SessionSystemPrompt.make(["read", "edit"])).not.toContain("Batch mechanical work")
})

test("asks for one verification pass, then a stop", () => {
  expect(SessionSystemPrompt.make(["read", "edit"])).toContain("One verification pass is enough")
})
