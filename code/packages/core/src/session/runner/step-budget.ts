export * as SessionStepBudget from "./step-budget.js"

/**
 * Soft step budget. The hard limit lives on the agent and disables tools; this only asks
 * for fewer round trips once, before the limit is reached, because the expensive runs are
 * the ones that keep making one call per step while the work is already known.
 *
 * Nothing here edits history. The nudge is published as a new synthetic message, so a
 * restarted process sees it and does not repeat it.
 */

export const NUDGE =
  "You have used a lot of steps for this task. Stop exploring one call at a time: put the remaining work into a single `execute` script that makes every call it needs, then report. If the task is already finished, say so and stop."

/** Steps are numbered from one, so this is the twelfth model call in the turn. */
export const DEFAULT_BUDGET = 12

export function limit(configured: number | undefined, environment = process.env.REEF_STEP_BUDGET) {
  const override = environment === undefined ? undefined : Number(environment)
  if (override !== undefined && Number.isFinite(override) && override > 0) return Math.floor(override)
  return configured ?? DEFAULT_BUDGET
}

/** True on the step that should be nudged: the budget step, and never the hard limit step. */
export function due(step: number, configured: number | undefined) {
  if (configured !== undefined && step >= configured) return false
  return step === limit(configured)
}

export function nudged(messages: ReadonlyArray<{ readonly type: string; readonly text?: string }>) {
  return messages.some((message) => message.type === "synthetic" && message.text === NUDGE)
}
