export * as TimeTool from "./time.js"

import type { Context } from "@opencode/plugin/effect/plugin"
import { ToolFailure } from "@opencode/ai/effect"
import { DateTime, Effect, Schema } from "effect"
import { Session } from "../../session.js"

export const name = "time"

export const description = [
  "Report the current time, when this session started, and how long it has been running.",
  "Call this before answering any question about duration, deadlines, or how long work will take.",
  "Models cannot feel elapsed time, so measure it instead of guessing. Estimate in edits and minutes, not days.",
].join(" ")

export const Input = Schema.Struct({})

export const Output = Schema.Struct({
  now: Schema.String,
  started: Schema.String,
  elapsed: Schema.String,
})
export type Output = typeof Output.Type

export const format = (elapsed: number) => {
  const minutes = Math.floor(elapsed / 60_000)
  const seconds = Math.floor((elapsed % 60_000) / 1000)
  if (minutes < 1) return `${seconds}s`
  if (minutes < 60) return `${minutes}m ${seconds}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

export const Plugin = {
  id: "opencode.tool.time",
  effect: Effect.fn("TimeTool.Plugin")(function* (ctx: Context) {
    const sessions = yield* Session.Service
    yield* ctx.tool
      .transform((editor) =>
        editor.add({
          name,
          options: { codemode: false },
          description,
          input: Input,
          output: Output,
          execute: (_input, context) =>
            Effect.gen(function* () {
              const session = yield* sessions.get(context.sessionID)
              const started = DateTime.toEpochMillis(session.time.created)
              const now = Date.now()
              const value: Output = {
                now: new Date(now).toISOString(),
                started: new Date(started).toISOString(),
                elapsed: format(now - started),
              }
              return {
                output: value,
                content: `now: ${value.now}\nsession started: ${value.started}\nelapsed: ${value.elapsed}`,
                metadata: {},
              }
            }).pipe(
              Effect.mapError(
                (error) =>
                  new ToolFailure({
                    message: `Unable to read the session clock: ${error.message}`,
                    error,
                  }),
              ),
            ),
        }),
      )
      .pipe(Effect.orDie)
  }),
}
