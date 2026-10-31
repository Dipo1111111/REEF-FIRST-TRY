import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, test } from "bun:test"
import { SessionCacheMonitor } from "@opencode/core/session/cache-monitor"

const parts = (system: string[], tools: string[], messages: string[]) => ({
  system: system.map((text) => ({ type: "text", text })),
  tools: tools.map((name) => ({ name, description: name })),
  messages: messages.map((text) => ({ role: "user", text })),
})

const observe = (session: string, system: string[], tools: string[], messages: string[]) =>
  SessionCacheMonitor.observe(session, "primary", parts(system, tools, messages), "")

describe("SessionCacheMonitor", () => {
  beforeEach(() => SessionCacheMonitor.reset())

  test("the first request reuses nothing", () => {
    const row = observe("first", ["sys"], ["read"], ["hi"])
    expect(row.first).toBe(true)
    expect(row.part).toBe("none")
    expect(row.reusedBytes).toBe(0)
    expect(row.newBytes).toBe(row.totalBytes)
    expect(row.tokensBefore).toBe(0)
  })

  test("a changed system part is blamed on system", () => {
    observe("system", ["a", "b"], ["read"], ["hi"])
    const row = observe("system", ["a", "c"], ["read"], ["hi"])
    expect(row.part).toBe("system")
    expect(row.changedAt).toBe(1)
    expect(row.reusedBytes).toBeGreaterThan(0)
    expect(row.reusedBytes + row.newBytes).toBe(row.totalBytes)
  })

  test("a changed tool is blamed on tools", () => {
    observe("tools", ["a"], ["read", "write"], ["hi"])
    const row = observe("tools", ["a"], ["read", "edit"], ["hi"])
    expect(row.part).toBe("tools")
    expect(row.changedAt).toBe(1)
    expect(row.reusedBytes).toBeGreaterThan(0)
  })

  test("an appended message is blamed on messages at the append point", () => {
    observe("append", ["a"], ["read"], ["one", "two"])
    const row = observe("append", ["a"], ["read"], ["one", "two", "three"])
    expect(row.part).toBe("messages")
    expect(row.changedAt).toBe(2)
    expect(row.reusedBytes).toBeGreaterThan(0)
  })

  test("an identical request reuses the whole prefix", () => {
    observe("same", ["a"], ["read"], ["one"])
    const row = observe("same", ["a"], ["read"], ["one"])
    expect(row.part).toBe("none")
    expect(row.reusedBytes).toBe(row.totalBytes)
    expect(row.newBytes).toBe(0)
    expect(row.tokensBefore).toBe(Math.round(row.totalBytes / 4))
  })

  test("sessions do not share the previous request", () => {
    observe("a", ["one"], ["read"], ["hi"])
    const row = observe("b", ["two"], ["read"], ["hi"])
    expect(row.first).toBe(true)
    expect(row.part).toBe("none")
  })

  test("sequences are per session", () => {
    expect(observe("seq", ["a"], [], []).seq).toBe(1)
    expect(observe("seq", ["a"], [], []).seq).toBe(2)
    expect(observe("other", ["a"], [], []).seq).toBe(1)
  })

  test("request kinds are compared separately", () => {
    SessionCacheMonitor.observe("kinds", "primary", parts(["a"], ["read"], ["hi"]), "")
    const title = SessionCacheMonitor.observe("kinds", "title", parts(["t"], [], []), "")
    expect(title.first).toBe(true)
    const primary = SessionCacheMonitor.observe("kinds", "primary", parts(["a"], ["read"], ["hi"]), "")
    expect(primary.part).toBe("none")
    expect(primary.seq).toBe(2)
  })

  test("rows are appended as json lines", () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "reef-monitor-")), "rows.jsonl")
    SessionCacheMonitor.observe("file", "primary", parts(["a"], [], []), file)
    SessionCacheMonitor.observe("file", "primary", parts(["a"], [], ["more"]), file)
    const rows = readFileSync(file, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
    expect(rows).toHaveLength(2)
    expect(rows[0].part).toBe("none")
    expect(rows[1].part).toBe("messages")
  })
})
