import { describe, expect, test } from "bun:test"
import { SessionStepBudget } from "@opencode/core/session/runner/step-budget"

describe("step budget", () => {
  test("nudges once at the default budget step", () => {
    expect(SessionStepBudget.due(SessionStepBudget.DEFAULT_BUDGET - 1, undefined)).toBe(false)
    expect(SessionStepBudget.due(SessionStepBudget.DEFAULT_BUDGET, undefined)).toBe(true)
    expect(SessionStepBudget.due(SessionStepBudget.DEFAULT_BUDGET + 1, undefined)).toBe(false)
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

  test("the ceiling stops the turn after the default budget", () => {
    expect(SessionStepBudget.exhausted(SessionStepBudget.DEFAULT_CEILING - 1, undefined)).toBe(false)
    expect(SessionStepBudget.exhausted(SessionStepBudget.DEFAULT_CEILING, undefined)).toBe(true)
  })

  test("an explicit agent limit wins over the default ceiling", () => {
    expect(SessionStepBudget.exhausted(24, 50)).toBe(false)
    expect(SessionStepBudget.exhausted(50, 50)).toBe(true)
  })
})

