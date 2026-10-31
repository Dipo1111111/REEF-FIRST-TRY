export * as SessionMeter from "./meter.js"

import { appendFileSync } from "node:fs"

/**
 * Thin per-step meter. It writes one JSON line per completed step from the same
 * usage record the event stream carries, so totals can be checked against the
 * stream instead of trusted. Enable with `REEF_METER=<path>`.
 *
 * This changes no behavior. A failed write drops the row rather than the step.
 */

export interface Tokens {
  readonly input: number
  readonly output: number
  readonly reasoning: number
  readonly cache: { readonly read: number; readonly write: number }
}

export interface Input {
  readonly sessionID: string
  readonly messageID: string
  readonly model: unknown
  readonly finish: unknown
  readonly cost: number
  readonly tokens: Tokens
  readonly wallMs: number
}

export interface Row extends Input {
  readonly time: string
  readonly seq: number
}

const sequences = new Map<string, number>()

export function record(path: string, input: Input): Row {
  const seq = (sequences.get(input.sessionID) ?? 0) + 1
  sequences.set(input.sessionID, seq)
  const row: Row = { time: new Date().toISOString(), seq, ...input }
  try {
    appendFileSync(path, JSON.stringify(row) + "\n")
  } catch {
    // Same rule as the monitor: never break a step to report on it.
  }
  return row
}

/** Test hook. */
export function reset() {
  sequences.clear()
}
