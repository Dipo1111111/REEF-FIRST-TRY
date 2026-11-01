import { describe, expect, test } from "bun:test"
import { SessionStepBudget } from "@opencode/core/session/runner/step-budget"

describe("step budget", () => {
  test("nudges once at the default budget step", () => {
    expect(SessionStepBudget.due(11, undefined)).toBe(false)
    expect(SessionStepBudget.due(12, undefined)).toBe(true)
    expect(SessionStepBudget.due(13, undefined)).toBe(false)
  })

  test("never nudges on the step where the hard limit disables tools", () => {
    expect(SessionStepBudget.due(5, 5)).toBe(false)
    expect(SessionStepBudget.due(6, 5)).toBe(false)
  })

  test("an environment override replaces the default and the agent limit still wins", () => {
    expect(SessionStepBudget.limit(undefined, "3")).toBe(3)
    expect(SessionStepBudget.limit(20, "3")).toBe(3)
    expect(SessionStepBudget.limit(20, "nonsense")).toBe(20)
    expect(SessionStepBudget.limit(20, "0")).toBe(20)
  })

  test("a session that already carries the nudge is not nudged again", () => {
    expect(SessionStepBudget.nudged([{ type: "synthetic", text: SessionStepBudget.NUDGE }])).toBe(true)
    expect(SessionStepBudget.nudged([{ type: "synthetic", text: "something else" }])).toBe(false)
    expect(SessionStepBudget.nudged([{ type: "user", text: SessionStepBudget.NUDGE }])).toBe(false)
  })
})

