import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, test } from "bun:test"
import { SessionMeter } from "@opencode/core/session/meter"

const tokens = (input: number, output: number) => ({
  input,
  output,
  reasoning: 0,
  cache: { read: 0, write: 0 },
})

describe("SessionMeter", () => {
  beforeEach(() => SessionMeter.reset())

  test("one row per step, with a per-session sequence", () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "reef-meter-")), "meter.jsonl")
    SessionMeter.record(file, {
      sessionID: "ses_one",
      messageID: "msg_one",
      model: { providerID: "p", modelID: "m" },
      finish: "stop",
      cost: 0.5,
      tokens: tokens(10, 2),
      wallMs: 120,
    })
    SessionMeter.record(file, {
      sessionID: "ses_one",
      messageID: "msg_two",
      model: { providerID: "p", modelID: "m" },
      finish: "stop",
      cost: 0.25,
      tokens: tokens(20, 3),
      wallMs: 80,
    })
    const rows = readFileSync(file, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.seq)).toEqual([1, 2])
    expect(rows.reduce((sum, row) => sum + row.tokens.input, 0)).toBe(30)
    expect(rows.reduce((sum, row) => sum + row.cost, 0)).toBe(0.75)
  })
})
