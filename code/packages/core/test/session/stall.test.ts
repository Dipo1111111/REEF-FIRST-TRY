import { describe, expect, test } from "bun:test"
import { Cause, Effect, Exit, Stream } from "effect"
import { SessionRunnerStall } from "@opencode/core/session/runner/stall"

describe("SessionRunnerStall", () => {
  test("a stream that keeps producing is untouched", async () => {
    const values = await Effect.runPromise(
      Stream.make(1, 2, 3).pipe((stream) => SessionRunnerStall.withStallTimeout(stream, 100), Stream.runCollect),
    )
    expect(Array.from(values)).toEqual([1, 2, 3])
  })

  test("a stream that stops producing fails as a transport read", async () => {
    const exit = await Effect.runPromiseExit(
      Stream.make(1).pipe(Stream.concat(Stream.never), (stream) => SessionRunnerStall.withStallTimeout(stream, 20), Stream.runCollect),
    )
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const text = Cause.pretty(exit.cause)
      expect(text).toContain("no data")
      expect(text).toContain("Transport")
    }
  })

  test("a long gap after an event still fails", async () => {
    const exit = await Effect.runPromiseExit(
      Stream.make(1).pipe(
        Stream.concat(Stream.fromEffect(Effect.sleep("200 millis").pipe(Effect.as(2)))),
        (stream) => SessionRunnerStall.withStallTimeout(stream, 20),
        Stream.runCollect,
      ),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  test("the duration is configurable, with a safe default", () => {
    expect(SessionRunnerStall.stallMs({})).toBe(SessionRunnerStall.DEFAULT_STALL_MS)
    expect(SessionRunnerStall.stallMs({ REEF_STALL_MS: "1000" })).toBe(1000)
    expect(SessionRunnerStall.stallMs({ REEF_STALL_MS: "nonsense" })).toBe(SessionRunnerStall.DEFAULT_STALL_MS)
    expect(SessionRunnerStall.stallMs({ REEF_STALL_MS: "-5" })).toBe(SessionRunnerStall.DEFAULT_STALL_MS)
  })
})

