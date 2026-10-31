// Mock OpenAI-compatible endpoint for the rig.
//
// Purpose: measure the request the harness builds (tool definitions, system
// parts, instructions) without spending tokens or needing a provider key.
// It logs every request body to LOG_DIR and answers with a short SSE stream.
//
//   bun rig/mock/server.ts --port 4567 --out rig/results/requests
//
// This is test scaffolding, not part of the product.

const args = process.argv.slice(2)
const arg = (name: string, fallback: string) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const port = Number(arg("--port", "4567"))
const out = arg("--out", "rig/results/requests")

const counter = { value: 0 }

const server = Bun.serve({
  port,
  idleTimeout: 120,
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === "/health") return new Response("ok")

    const body = await request.text()
    counter.value += 1
    const stamp = `${Date.now()}-${String(counter.value).padStart(3, "0")}`
    const dir = `${out}/${stamp}`
    await Bun.write(`${dir}/request.json`, body)
    await Bun.write(
      `${dir}/headers.json`,
      JSON.stringify(
        Object.fromEntries(
          Object.entries(request.headers.toJSON()).map(([key, value]) => [
            key,
            key.toLowerCase() === "authorization" ? (value ? "present" : "absent") : value,
          ]),
        ),
        null,
        2,
      ),
    )
    await Bun.write(`${dir}/path.txt`, url.pathname + (url.search ? url.search : ""))

    let model = "mock"
    try {
      model = JSON.parse(body).model ?? "mock"
    } catch {}

    const stream = request.headers.get("accept")?.includes("text/event-stream") || body.includes('"stream":true')

    if (!stream) {
      return Response.json({
        id: `chatcmpl-${stamp}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, message: { role: "assistant", content: "mock reply" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      })
    }

    const encoder = new TextEncoder()
    const chunks = [
      {
        id: `chatcmpl-${stamp}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: { role: "assistant", content: "mock reply" }, finish_reason: null }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      },
      {
        id: `chatcmpl-${stamp}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      },
    ]

    return new Response(
      new ReadableStream({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        },
      }),
      { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } },
    )
  },
})

console.log(`mock provider on http://127.0.0.1:${server.port} writing to ${out}`)
