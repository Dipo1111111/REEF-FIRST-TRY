import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, test } from "bun:test"
import { SessionCompactionLedger } from "@opencode/core/session/compaction-ledger"

const input = {
  sessionID: "ses_one",
  reason: "manual" as const,
  model: { providerID: "p", modelID: "m" },
  tokensBefore: 40_000,
  tokensAfter: 18_000,
  tokensDropped: 22_000,
  native: false,
}

describe("SessionCompactionLedger", () => {
  test("one row per compaction with its cost", () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "reef-compaction-")), "rows.jsonl")
    SessionCompactionLedger.record(file, input)
    SessionCompactionLedger.record(file, { ...input, reason: "overflow", tokensDropped: 30_000 })
    const rows = readFileSync(file, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
    expect(rows).toHaveLength(2)
    expect(rows[0].tokensBefore).toBe(40_000)
    expect(rows[1].reason).toBe("overflow")
    expect(rows[1].tokensDropped).toBe(30_000)
    expect(typeof rows[0].time).toBe("string")
  })

  test("a bad path never throws", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "reef-compaction-bad-"))
    expect(() => SessionCompactionLedger.record(dir, input)).not.toThrow()
  })
})
