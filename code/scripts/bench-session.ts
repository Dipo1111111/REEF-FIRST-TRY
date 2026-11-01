// Session benchmark. Reports the four numbers that decide whether a harness is fast:
// model requests, tool calls per request, prompt tokens per request, and wall clock.
//
// Usage: bun run scripts/bench-session.ts [sessionID] [--db <path>]
//
// The database defaults to the Reef data directory. A session id defaults to the most
// recent one, so a run can be measured straight after it finishes.
import { Database } from "bun:sqlite"
import path from "path"
import os from "os"

const args = process.argv.slice(2)
const dbFlag = args.indexOf("--db")
const database = dbFlag === -1 ? path.join(os.homedir(), ".local", "share", "reef", "opencode.db") : args[dbFlag + 1]!
const requested = args.filter((arg, index) => index !== dbFlag && index !== dbFlag + 1 && !arg.startsWith("--"))

const db = new Database(database, { readonly: true })
const session = requested[0]
  ? (db.query("select * from session_v2 where id = ?").get(session) as any)
  : (db.query("select * from session_v2 order by time_created desc limit 1").get() as any)
if (!session) {
  console.error("no session found")
  process.exit(1)
}

const rows = db
  .query("select type, seq, data from session_message where session_id = ? order by seq")
  .all(session.id) as any[]

const requests: Array<{
  tools: number
  output: number
  reasoning: number
  fresh: number
  cached: number
  started?: number
  completed?: number
}> = []
for (const row of rows) {
  if (row.type !== "assistant") continue
  const data = JSON.parse(row.data)
  const tokens = data.tokens ?? {}
  requests.push({
    tools: (data.content ?? []).filter((part: any) => part.type === "tool").length,
    output: tokens.output ?? 0,
    reasoning: tokens.reasoning ?? 0,
    fresh: tokens.input ?? 0,
    cached: tokens.cache?.read ?? 0,
    started: data.time?.created,
    completed: data.time?.completed,
  })
}

const count = requests.length
const sum = (pick: (item: (typeof requests)[number]) => number) => requests.reduce((total, item) => total + pick(item), 0)
const toolCalls = sum((item) => item.tools)
const promptTokens = sum((item) => item.fresh + item.cached)
const first = requests.find((item) => item.started !== undefined)?.started
const last = requests.filter((item) => item.completed !== undefined).at(-1)?.completed
const wallSeconds = first !== undefined && last !== undefined ? (last - first) / 1000 : 0
const prompts = requests.map((item) => item.fresh + item.cached)

const tools: Record<string, number> = {}
for (const row of rows) {
  if (row.type !== "assistant") continue
  for (const part of JSON.parse(row.data).content ?? [])
    if (part.type === "tool") tools[part.name] = (tools[part.name] ?? 0) + 1
}

console.log(`session            ${session.id}`)
console.log(`directory          ${session.directory}`)
console.log(`model requests     ${count}`)
console.log(`tool calls         ${toolCalls}`)
console.log(`tools per request  ${count ? (toolCalls / count).toFixed(2) : "0"}`)
console.log(`requests with 1    ${requests.filter((item) => item.tools === 1).length}`)
console.log(`max tools/request  ${Math.max(0, ...requests.map((item) => item.tools))}`)
console.log(`prompt tokens      ${promptTokens} total, ${count ? Math.round(promptTokens / count) : 0} average, ${Math.max(0, ...prompts)} peak`)
console.log(`output tokens      ${sum((item) => item.output + item.reasoning)} total, ${count ? Math.round(sum((item) => item.output + item.reasoning) / count) : 0} per request`)
console.log(`cost               $${session.cost}`)
console.log(`wall clock         ${wallSeconds.toFixed(1)}s`)
console.log(`tools              ${JSON.stringify(tools)}`)
