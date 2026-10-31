export * as SessionCompactionLedger from "./compaction-ledger.js"

import { appendFileSync } from "node:fs"

/**
 * One row per completed compaction, so compaction is an event with a cost rather
 * than a background habit. Enable with `REEF_COMPACTION_LOG=<path>`.
 *
 * `tokensDropped` is the difference between the request before and after. The
 * prefix that was replaced is also cache that the provider will have to rebuild,
 * which is why a compaction is expensive beyond the summary call itself.
 */

export interface Input {
  readonly sessionID: string
  readonly reason: "manual" | "auto" | "overflow"
  readonly model: unknown
  readonly tokensBefore: number
  readonly tokensAfter: number
  readonly tokensDropped: number
  readonly native: boolean
  readonly usage?: unknown
}

export interface Row extends Input {
  readonly time: string
}

export function record(path: string, input: Input): Row {
  const row: Row = { time: new Date().toISOString(), ...input }
  try {
    appendFileSync(path, JSON.stringify(row) + "\n")
  } catch {
    // Reporting must never fail a compaction.
  }
  return row
}
