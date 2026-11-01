export * as SessionStepBudget from "./step-budget.js"

/**
 * Step budget. The nudge asks the model to land the work at the budget step; the ceiling
 * disables tools and forces a summary if it keeps going. Both exist because an unbounded
 * loop turns a cheap step into an expensive run: the per-step savings of Code Mode only
 * survive if the number of steps stays bounded.
 *
 * Nothing here edits history. The nudge is published as a new synthetic message, so a
 * restarted process sees it and does not repeat it.
 */

export const NUDGE =
  "You have used enough steps for this task. Stop expanding scope: finish the smallest version of the request now. If the work is already done, say so and stop. Do not start another investigation, refactor, or polish pass."

export const CEILING_PROMPT = `CRITICAL - STEP CEILING REACHED

This turn reached its step ceiling. Tools are disabled until the user sends another message. Respond with text only.

STRICT REQUIREMENTS:
1. Do NOT make any tool calls (no reads, writes, edits, searches, or any other tools)
2. Report what is finished and what is not, in the same message
3. State the command the user can run to see or verify the current result

Any attempt to use tools is a critical violation. Respond with text ONLY.`

/** Steps are numbered from one, so this is the twelfth model call in the turn. */
export const DEFAULT_BUDGET = 12

/** Hard safety net for a turn that ignores the nudge. Twice the soft budget. */
export const DEFAULT_CEILING = 24

export function limit(configured: number | undefined, environment = process.env.REEF_STEP_BUDGET) {
  const override = environment === undefined ? undefined : Number(environment)
  if (override !== undefined && Number.isFinite(override) && override > 0) return Math.floor(override)
  return configured ?? DEFAULT_BUDGET
}

export function ceiling(configured: number | undefined, environment = process.env.REEF_STEP_CEILING) {
  const override = environment === undefined ? undefined : Number(environment)
  if (override !== undefined && Number.isFinite(override) && override > 0) return Math.floor(override)
  return configured ?? DEFAULT_CEILING
}

/** True on the step that should be nudged: the budget step, and never the hard limit step. */
export function due(step: number, configured: number | undefined) {
  if (configured !== undefined && step >= configured) return false
  return step === limit(configured)
}

/** True once the turn must stop calling tools and summarize. */
export function exhausted(step: number, configured: number | undefined) {
  return step >= ceiling(configured)
}

export function nudged(messages: ReadonlyArray<{ readonly type: string; readonly text?: string }>) {
  return messages.some((message) => message.type === "synthetic" && message.text === NUDGE)
}
