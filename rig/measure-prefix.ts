// Measures what the first real agent request contains, from a logged mock request.
//
//   bun rig/measure-prefix.ts <request-dir-or-json> [--out results/prefix-v0.json]
//
// Reports bytes and estimated tokens per component. Token estimates use chars/4,
// which is close enough for GPT-family and DeepSeek tokenizers and identical
// across phases, so the comparison stays valid even if the absolute number is off.

const args = process.argv.slice(2)
const input = args.find((a) => !a.startsWith("--"))
if (!input) {
  console.error("usage: bun rig/measure-prefix.ts <request.json|dir> [--out file]")
  process.exit(2)
}

const readText = async (path: string) => {
  const stat = await Bun.file(path).exists()
  return stat ? Bun.file(path).text() : undefined
}

const raw = (await readText(input)) ?? (await readText(`${input}/request.json`))
if (!raw) {
  console.error(`no request.json at ${input}`)
  process.exit(2)
}

const body = JSON.parse(raw)
const textLength = (value: unknown) =>
  typeof value === "string" ? value.length : value === undefined || value === null ? 0 : JSON.stringify(value).length

const messages: Array<{ role: string; bytes: number }> = (body.messages ?? []).map((m: any) => ({
  role: m.role ?? "?",
  bytes: textLength(m.content),
}))

const tools: Array<{ name: string; bytes: number }> = (body.tools ?? []).map((t: any) => ({
  name: t.function?.name ?? t.name ?? "?",
  bytes: JSON.stringify(t).length,
}))

const system = messages.filter((m) => m.role === "system").reduce((sum, m) => sum + m.bytes, 0)
const other = messages.filter((m) => m.role !== "system").reduce((sum, m) => sum + m.bytes, 0)
const toolBytes = tools.reduce((sum, t) => sum + t.bytes, 0)
const total = system + other + toolBytes

const result = {
  captured: new Date().toISOString(),
  model: body.model ?? "unknown",
  messageCount: messages.length,
  toolCount: tools.length,
  bytes: {
    system,
    tools: toolBytes,
    messages: other,
    total,
  },
  estimatedTokens: {
    system: Math.round(system / 4),
    tools: Math.round(toolBytes / 4),
    messages: Math.round(other / 4),
    total: Math.round(total / 4),
  },
  tools: tools.sort((a, b) => b.bytes - a.bytes),
  messages,
}

const outIndex = args.indexOf("--out")
const out = outIndex >= 0 ? args[outIndex + 1] : undefined
if (out) await Bun.write(out, JSON.stringify(result, null, 2) + "\n")

console.log(JSON.stringify({ ...result, tools: result.tools.slice(0, 8) }, null, 2))
