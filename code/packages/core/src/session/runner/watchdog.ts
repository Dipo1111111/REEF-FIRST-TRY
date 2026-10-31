export * as SessionRunnerWatchdog from "./watchdog.js"

import type { SessionMessage } from "../message.js"

/**
 * Loop watchdog. It reads stored messages, not in-memory counters, so a process
 * restart cannot reset a streak. It answers one question: should this step run,
 * be nudged once, or stop?
 *
 * Rules:
 * - three assistant turns in a row with no visible text and no tool call: stop.
 * - the same tool call (name plus deep-equal input) three times: one nudge.
 * - the same call six times: stop.
 * - identical calls whose results differ (polling): the run resets.
 *
 * Nothing here edits history. The nudge is published as a new synthetic message.
 */

export const NUDGE =
  "You have made the same tool call three times and the result has not changed. " +
  "Change approach or stop. Repeating that exact call will end the run."

export const EMPTY_LIMIT = 3
export const NUDGE_LIMIT = 3
export const STOP_LIMIT = 6

export type Verdict =
  | { readonly kind: "ok" }
  | { readonly kind: "nudge"; readonly calls: number }
  | { readonly kind: "empty"; readonly turns: number }
  | { readonly kind: "stop"; readonly calls: number }

function stable(value: unknown): string {
  if (value === null) return "null"
  if (typeof value !== "object") return JSON.stringify(value) ?? "null"
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`
}

/** Trailing assistant turns with no text and no tool call. Reasoning alone is invisible. */
export function emptyTurns(messages: ReadonlyArray<SessionMessage.Info>) {
  let count = 0
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    if (message.type !== "assistant") break
    const visible = message.content.some((part) => part.type === "text" && part.text.trim().length > 0)
    const call = message.content.some((part) => part.type === "tool")
    if (visible || call) break
    count++
  }
  return count
}

interface Call {
  readonly signature: string
  readonly result?: string
}

/** Tool calls in order, with a signature and a result fingerprint when one exists. */
export function calls(messages: ReadonlyArray<SessionMessage.Info>) {
  const found: Call[] = []
  for (const message of messages) {
    if (message.type !== "assistant") continue
    for (const part of message.content) {
      if (part.type !== "tool" || part.state.status === "streaming") continue
      found.push({
        signature: `${part.name}\u0000${stable(part.state.input)}`,
        result: part.state.status === "completed" ? stable(part.state.content) : undefined,
      })
    }
  }
  return found
}

/** Length of the trailing run of one call, reset when a repeat returns a different result. */
export function repeatedCalls(calls: ReadonlyArray<Call>) {
  if (calls.length === 0) return 0
  let run = 1
  for (let index = calls.length - 1; index > 0; index--) {
    const current = calls[index]
    const previous = calls[index - 1]
    if (current.signature !== previous.signature) break
    // The same call returning different output is polling, not a loop.
    if (current.result !== undefined && previous.result !== undefined && current.result !== previous.result) {
      run = 1
      break
    }
    run++
  }
  return run
}

export function inspect(messages: ReadonlyArray<SessionMessage.Info>): Verdict {
  const empty = emptyTurns(messages)
  if (empty >= EMPTY_LIMIT) return { kind: "empty", turns: empty }
  const run = repeatedCalls(calls(messages))
  if (run >= STOP_LIMIT) return { kind: "stop", calls: run }
  if (run >= NUDGE_LIMIT && !messages.some((message) => message.type === "synthetic" && message.text === NUDGE))
    return { kind: "nudge", calls: run }
  return { kind: "ok" }
}
