// Renders a real session from design/fixtures/session.json so the transcript can be
// designed without a model call.
//
//   bun run script/capture-session.ts --width 120 --height 40 --name session-120x40

import { createTestRenderer } from "@opentui/core/testing"
import { Effect, FileSystem } from "effect"
import { Global } from "@opencode/util/global"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { createEventStream, createFetch, directory, json } from "../test/fixture/tui-client"
import { tmpdir } from "../test/fixture/fixture"

const args = process.argv.slice(2)
const flag = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : fallback
}
const width = Number(flag("width", "120"))
const height = Number(flag("height", "40"))
const name = flag("name", "session")
const out = path.resolve(import.meta.dir, "../../../../design/frames")

const fixture = (await Bun.file(path.resolve(import.meta.dir, "../../../../design/fixtures/session.json")).json()) as {
  session: Record<string, unknown> & { id: string }
  messages: { id: string }[]
}
const session = { ...fixture.session, location: { directory } }
const first = Number(flag("first", "0"))
const messages = (first ? fixture.messages.slice(0, first) : fixture.messages).map((message) => ({ ...message, sessionID: session.id }))

await using state = await tmpdir()
const setup = await createTestRenderer({ width, height, kittyKeyboard: true })
await setup.renderer.setupTerminal()
setup.renderer.start()

const events = createEventStream()
const calls = createFetch(async (url) => {
  if (url.pathname === "/api/session") return json({ data: [session], cursor: {} })
  if (url.pathname === `/api/session/${session.id}`) return json({ data: session })
  if (url.pathname === `/api/session/${session.id}/message`) {
    const end = Number(url.searchParams.get("cursor") ?? messages.length)
    const limit = Number(url.searchParams.get("limit")) || 200
    const start = Math.max(0, end - limit)
    return json({ data: messages.slice(start, end).toReversed(), cursor: end ? { next: String(start) } : {} })
  }
  if (url.pathname === `/api/session/${session.id}/inbox`) return json({ data: [] })
  if (url.pathname === `/api/session/${session.id}/permission`) return json({ data: [] })
  return undefined
}, events)

const server = Bun.serve({ port: 0, idleTimeout: 0, fetch: (request) => calls.fetch(request) })

const { run } = await import("../src/app")
void Effect.runPromise(
  run({
    app: { name: "Reef", version: "0.1.0", channel: "test" },
    server: { endpoint: { url: server.url.toString() } },
    config: {
      get: async () => ({ animations: false, tabs: { mode: "off" } }),
      update: async () => ({}),
    },
    packages: { prepare: async () => ({ directory: "" }) },
    terminalHandoff: async () => ({ renderer: setup.renderer, mode: "dark", complete: () => {} }),
    args: { sessionID: session.id as string },
    log: () => {},
  }).pipe(Effect.provide(Global.layerWith({ state: state.path })), Effect.provide(FileSystem.layerNoop({}))),
)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
let frame = ""
for (let attempt = 0; attempt < 40; attempt++) {
  await sleep(250)
  frame = setup.captureCharFrame()
  if (frame.includes("architect")) break
}
await setup.renderOnce()

frame = setup.captureCharFrame()
const captured = setup.captureSpans()
await mkdir(out, { recursive: true })
const file = `${name}-${width}x${height}`
await Bun.write(path.join(out, `${file}.txt`), frame)

const rgb = (value: { r: number; g: number; b: number }) => {
  const scale = value.r <= 1 && value.g <= 1 && value.b <= 1 ? 255 : 1
  const channel = (n: number) => Math.round(n * scale).toString(16).padStart(2, "0")
  return `#${channel(value.r)}${channel(value.g)}${channel(value.b)}`
}
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll(" ", "&nbsp;")
const lines = captured.lines.map((line) =>
  line.spans.map((span) => `<span style="color:${rgb(span.fg)};background:${rgb(span.bg)}">${escape(span.text)}</span>`).join(""),
)
await Bun.write(
  path.join(out, `${file}.html`),
  `<!doctype html><meta charset="utf-8"><title>${file}</title>
<style>body{margin:0;padding:16px;background:#101010}pre{margin:0;font:14px/1.2 "Cascadia Mono","Consolas",monospace;white-space:pre}</style>
<pre>${lines.join("\n")}</pre>`,
)

console.log(`${file}: ${frame.length} chars -> ${path.join(out, `${file}.txt`)}`)
process.exit(0)

