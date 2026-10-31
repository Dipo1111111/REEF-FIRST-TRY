// Renders a real TUI screen to text and HTML so a design can be reviewed without
// rebuilding or installing. Dev-only; it drives the same app the tests drive.
//
//   bun run script/capture-frame.ts --width 100 --height 30 --name home
//
// Writes design/frames/<name>-<w>x<h>.txt and .html at the repository root.

import { mkdir } from "node:fs/promises"
import path from "node:path"
import { createAppFixture } from "../test/fixture/app"

const args = process.argv.slice(2)
const flag = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : fallback
}
const width = Number(flag("width", "100"))
const height = Number(flag("height", "30"))
const name = flag("name", "screen")
const out = path.resolve(import.meta.dir, "../../../../design/frames")

const rgb = (value: { r: number; g: number; b: number; a?: number }) => {
  const scale = value.r <= 1 && value.g <= 1 && value.b <= 1 ? 255 : 1
  const channel = (n: number) => Math.round(n * scale).toString(16).padStart(2, "0")
  return `#${channel(value.r)}${channel(value.g)}${channel(value.b)}`
}
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll(" ", "&nbsp;")

await mkdir(out, { recursive: true })
await using app = await createAppFixture({ width, height })
await app.ready
await app.renderOnce()
await app.waitForVisualIdle({ quietFrames: 2 }).catch(() => {})
await app.renderOnce()

const plain = app.captureCharFrame()
const frame = app.captureSpans()

const file = `${name}-${width}x${height}`
await Bun.write(path.join(out, `${file}.txt`), plain)

// Each cell keeps its own colours, so the preview is what the terminal would show.
const lines = frame.lines.map((line) =>
  line.spans
    .map((span) => `<span style="color:${rgb(span.fg)};background:${rgb(span.bg)}">${escape(span.text)}</span>`)
    .join(""),
)
const background = frame.lines[0]?.spans[0] ? rgb(frame.lines[0].spans[0].bg) : "#101010"
await Bun.write(
  path.join(out, `${file}.html`),
  `<!doctype html><meta charset="utf-8"><title>${file}</title>
<style>
  body { margin: 0; padding: 16px; background: ${background}; }
  pre { margin: 0; font: 14px/1.2 "Cascadia Mono", "Consolas", monospace; white-space: pre; }
</style>
<pre>${lines.join("\n")}</pre>
`,
)

console.log(`${file}: ${width}x${height} -> ${path.join(out, `${file}.html`)}`)

