export * as SessionRunnerStall from "./stall.js"

import { AIError, TransportError } from "@opencode/ai/effect"
import { Stream } from "effect"

/**
 * A provider that sends headers and then goes quiet must not hold a step open
 * forever. The timeout is checked on every pull, so activity resets it: a long
 * answer that keeps streaming is fine, a silence is not. The failure is a
 * transport read failure, so the existing retry policy treats it as retryable.
 */

export const DEFAULT_STALL_MS = 240_000

/** Shared with the runner so a stall failure can be counted without parsing the transport error. */
export const STALL_MESSAGE = "Provider sent no data for"

export function stallMs(env: Record<string, string | undefined> = process.env) {
  const value = Number(env.REEF_STALL_MS)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_STALL_MS
}

export function stalled(ms: number) {
  return new AIError({
    reason: new TransportError({
      message: `${STALL_MESSAGE} ${ms}ms`,
      transport: "http",
      operation: "read",
      phase: "receive",
      delivery: "accepted",
      recovery: "retry-full",
    }),
  })
}

export function withStallTimeout<A, E, R>(stream: Stream.Stream<A, E, R>, ms = stallMs()) {
  return stream.pipe(
    Stream.timeoutOrElse({
      duration: ms,
      orElse: () => Stream.fail(stalled(ms)),
    }),
  )
}
