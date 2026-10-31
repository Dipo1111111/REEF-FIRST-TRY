import { describe, expect, test } from "bun:test"
import { SessionRunnerWatchdog } from "@opencode/core/session/runner/watchdog"
import type { SessionMessage } from "@opencode/schema/session-message"

const base = { id: "msg_test", time: { created: 0 } }

const assistant = (content: unknown[]) =>
  ({
    ...base,
    type: "assistant",
    agent: "build",
    model: { providerID: "p", modelID: "m" },
    content,
  }) as unknown as SessionMessage.Info

const text = (value: string) => ({ type: "text", text: value })
const reasoning = (value: string) => ({ type: "reasoning", text: value })
const tool = (name: string, input: unknown, output: string) => ({
  type: "tool",
  id: `tool_${name}`,
  name,
  state: { status: "completed", input, content: [{ type: "text", text: output }] },
})
const synthetic = (value: string) => ({ ...base, type: "synthetic", text: value }) as unknown as SessionMessage.Info

const repeat = (input: unknown, output: string, times: number) =>
  Array.from({ length: times }, () => assistant([tool("read", input, output)]))

describe("SessionRunnerWatchdog", () => {
  test("a varied history is ok", () => {
    const messages = [assistant([tool("read", { path: "a" }, "one")]), assistant([tool("read", { path: "b" }, "two")])]
    expect(SessionRunnerWatchdog.inspect(messages).kind).toBe("ok")
  })

  test("three empty assistant turns stop the run", () => {
    const messages = [assistant([reasoning("thinking")]), assistant([]), assistant([])]
    expect(SessionRunnerWatchdog.emptyTurns(messages)).toBe(3)
    expect(SessionRunnerWatchdog.inspect(messages)).toEqual({ kind: "empty", turns: 3 })
  })

  test("visible text breaks an empty streak", () => {
    const messages = [assistant([]), assistant([]), assistant([text("here is the answer")])]
    expect(SessionRunnerWatchdog.inspect(messages).kind).toBe("ok")
  })

  test("a tool call breaks an empty streak even with no text", () => {
    const messages = [assistant([]), assistant([]), assistant([tool("read", { path: "a" }, "x")])]
    expect(SessionRunnerWatchdog.inspect(messages).kind).toBe("ok")
  })

  test("three identical calls ask for one nudge", () => {
    const messages = repeat({ path: "a" }, "same", 3)
    expect(SessionRunnerWatchdog.repeatedCalls(SessionRunnerWatchdog.calls(messages))).toBe(3)
    expect(SessionRunnerWatchdog.inspect(messages)).toEqual({ kind: "nudge", calls: 3 })
  })

  test("the nudge is not repeated", () => {
    const messages = [...repeat({ path: "a" }, "same", 3), synthetic(SessionRunnerWatchdog.NUDGE)]
    expect(SessionRunnerWatchdog.inspect(messages).kind).toBe("ok")
  })

  test("six identical calls stop even after the nudge", () => {
    const messages = [...repeat({ path: "a" }, "same", 6), synthetic(SessionRunnerWatchdog.NUDGE)]
    expect(SessionRunnerWatchdog.inspect(messages)).toEqual({ kind: "stop", calls: 6 })
  })

  test("the same call with different results is polling, not a loop", () => {
    const messages = [
      assistant([tool("read", { path: "a" }, "one")]),
      assistant([tool("read", { path: "a" }, "two")]),
      assistant([tool("read", { path: "a" }, "three")]),
    ]
    expect(SessionRunnerWatchdog.inspect(messages).kind).toBe("ok")
  })

  test("the same input with different key order still counts as the same call", () => {
    const messages = [
      assistant([tool("read", { path: "a", limit: 1 }, "same")]),
      assistant([tool("read", { limit: 1, path: "a" }, "same")]),
      assistant([tool("read", { path: "a", limit: 1 }, "same")]),
    ]
    expect(SessionRunnerWatchdog.inspect(messages)).toEqual({ kind: "nudge", calls: 3 })
  })
})
