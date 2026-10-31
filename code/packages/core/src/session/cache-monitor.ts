export * as SessionCacheMonitor from "./cache-monitor.js"

import { createHash } from "node:crypto"
import { appendFileSync } from "node:fs"
import type { LLMRequest } from "@opencode/ai/effect"

/**
 * Read-only prompt-cache monitor. It hashes the three parts of a request in prefix
 * order and compares each request with the previous one in the same session. When
 * the prefix moves, it names the first part that changed, because everything after
 * that break is paid for again.
 *
 * Enable with `REEF_CACHE_MONITOR=<path>`; rows are appended as JSON lines. It never
 * edits a request and it keeps no global history: state is per session, capped so a
 * long-lived process cannot grow it without bound.
 */

export type Part = "none" | "system" | "tools" | "messages"

export interface Row {
  readonly time: string
  readonly sessionID: string
  readonly seq: number
  /** Request flow, e.g. `primary`, `title`, `compaction`. Compared separately. */
  readonly kind: string
  readonly part: Part
  /** Index within `part` where the first difference starts. */
  readonly changedAt: number
  readonly first: boolean
  /** Bytes of the prefix that can be reused before the change. */
  readonly reusedBytes: number
  /** Bytes at and after the change. */
  readonly newBytes: number
  readonly totalBytes: number
  /** Rough token count of the reusable prefix, at four bytes per token. */
  readonly tokensBefore: number
}

/** The request fields the monitor needs. Structural, so tests need no provider. */
export interface RequestParts {
  readonly system: ReadonlyArray<unknown>
  readonly tools: ReadonlyArray<unknown>
  readonly messages: ReadonlyArray<unknown>
}

interface Fingerprint {
  readonly hash: string
  readonly bytes: number
}

interface Snapshot {
  readonly system: ReadonlyArray<Fingerprint>
  readonly tools: ReadonlyArray<Fingerprint>
  readonly messages: ReadonlyArray<Fingerprint>
  readonly totalBytes: number
  readonly seq: number
}

const PARTS = ["system", "tools", "messages"] as const
const MAX_SESSIONS = 256
const sessions = new Map<string, Snapshot>()

/** Deterministic JSON with sorted object keys, so hashes survive key order. */
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

function fingerprint(value: unknown): Fingerprint {
  const text = stable(value)
  return {
    hash: createHash("sha256").update(text).digest("hex").slice(0, 16),
    bytes: Buffer.byteLength(text),
  }
}

function snapshot(request: RequestParts, seq: number): Snapshot {
  const system = request.system.map(fingerprint)
  const tools = request.tools.map(fingerprint)
  const messages = request.messages.map(fingerprint)
  const totalBytes = [...system, ...tools, ...messages].reduce((sum, item) => sum + item.bytes, 0)
  return { system, tools, messages, totalBytes, seq }
}

function commonPrefix(previous: ReadonlyArray<Fingerprint>, current: ReadonlyArray<Fingerprint>) {
  const limit = Math.min(previous.length, current.length)
  let index = 0
  while (index < limit && previous[index].hash === current[index].hash) index++
  return index
}

/**
 * Compare two snapshots and report the first part that moved. Everything after the
 * first break is already stale, so later differences are not attributed.
 */
export function compare(
  previous: Snapshot | undefined,
  current: Snapshot,
): Omit<Row, "time" | "sessionID" | "seq" | "kind"> {
  if (!previous) {
    return {
      part: "none",
      changedAt: 0,
      first: true,
      reusedBytes: 0,
      newBytes: current.totalBytes,
      totalBytes: current.totalBytes,
      tokensBefore: 0,
    }
  }
  let reusedBytes = 0
  let part: Part = "none"
  let changedAt = 0
  for (const name of PARTS) {
    const before = previous[name]
    const after = current[name]
    const common = commonPrefix(before, after)
    for (let index = 0; index < common; index++) reusedBytes += after[index].bytes
    if (common < before.length || common < after.length) {
      part = name
      changedAt = common
      break
    }
  }
  return {
    part,
    changedAt,
    first: false,
    reusedBytes,
    newBytes: current.totalBytes - reusedBytes,
    totalBytes: current.totalBytes,
    tokensBefore: Math.round(reusedBytes / 4),
  }
}

function append(path: string, row: Row) {
  try {
    appendFileSync(path, JSON.stringify(row) + "\n")
  } catch {
    // A monitor that can fail a request is worse than no monitor. Drop the row.
  }
}

/**
 * Record one request. `path` is explicit so tests can skip writing; it defaults to
 * the environment variable the harness sets.
 */
export function observe(
  sessionID: string,
  kind: string,
  request: RequestParts,
  path: string | undefined = process.env.REEF_CACHE_MONITOR,
): Row {
  // A title or compaction request has its own system prompt and history. Comparing
  // it with the primary flow would report a break that no provider cache ever saw.
  const key = `${sessionID}\u0000${kind}`
  const previous = sessions.get(key)
  const current = snapshot(request, (previous?.seq ?? 0) + 1)
  const row: Row = {
    time: new Date().toISOString(),
    sessionID,
    seq: current.seq,
    kind,
    ...compare(previous, current),
  }
  sessions.delete(key)
  sessions.set(key, current)
  if (sessions.size > MAX_SESSIONS) {
    const oldest = sessions.keys().next().value
    if (oldest !== undefined) sessions.delete(oldest)
  }
  if (path) append(path, row)
  return row
}

/** Test hook: forget every session. */
export function reset() {
  sessions.clear()
}

/** Convenience for the call site. */
export const observeRequest = (sessionID: string, kind: string, request: LLMRequest) =>
  observe(sessionID, kind, request)
