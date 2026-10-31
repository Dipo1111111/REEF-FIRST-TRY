// Baseline supervisor: splits the task set across workers, runs them in
// parallel, enforces a hard token budget, and merges the rows into one file.
//
//   bun rig/baseline.ts --model opencode-go/deepseek-v4.1-flash \
//     --out rig/results/baseline-deepseek-v4.1-flash.json
//
// Why parallel: wall clock is a metric per session, not of the suite, so
// running three workers shortens the wait without corrupting any row. Each
// worker gets its own home, config, data, cache and state.
//
// Budget: token totals are watched from each worker's partial result file. If a
// single session passes the per-session cap, or the suite passes the total cap,
// every worker is killed and the run is marked aborted.

import { existsSync } from "node:fs"
import { copyFile, mkdir, readdir } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const args = process.argv.slice(2)
const flag = (name: string) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

const model = flag("--model")
if (!model) {
  console.error("--model is required")
  process.exit(2)
}

const out = flag("--out") ?? path.join(root, "rig", "results", `baseline-${model.replaceAll("/", "-")}.json`)
const perSessionCap = Number(flag("--per-session-cap") ?? "500000")
const totalCap = Number(flag("--total-cap") ?? "3500000")
const realRuns = Number(flag("--runs-real") ?? "2")
const controlRuns = Number(flag("--runs-control") ?? "1")

const base = path.join("C:", "reef-rig")
const seedDb = path.join(base, "data", "reef", "opencode-local.db")
if (!existsSync(seedDb)) {
  console.error(`no seeded credential database at ${seedDb}`)
  process.exit(2)
}

const taskDirs = (await readdir(path.join(root, "rig", "tasks"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
const controls = taskDirs.filter((id) => id.startsWith("control-"))
const real = taskDirs.filter((id) => !id.startsWith("control-"))

type Row = { task: string; run: number; category?: string; passed?: boolean; tokens?: { total?: number } }

const resumeFile = flag("--resume")
const previousRows: Row[] =
  resumeFile && existsSync(resumeFile) ? ((JSON.parse(await Bun.file(resumeFile).text()).rows ?? []) as Row[]) : []
const done = new Set(previousRows.map((row) => `${row.task}:${row.run}`))
const previousSpent = previousRows.reduce((sum, row) => sum + (row.tokens?.total ?? 0), 0)
if (previousRows.length) console.log(`resuming: ${previousRows.length} sessions done, ${previousSpent} tokens spent`)

const groups = [
  { name: "real-a", tasks: real.filter((_, index) => index % 2 === 0), real: realRuns, control: 0 },
  { name: "real-b", tasks: real.filter((_, index) => index % 2 === 1), real: realRuns, control: 0 },
  { name: "controls", tasks: controls, real: 0, control: controlRuns },
]

console.log(
  `baseline: ${real.length} real x ${realRuns} + ${controls.length} control x ${controlRuns} = ` +
    `${real.length * realRuns + controls.length * controlRuns} sessions, model ${model}, cap ${totalCap} tokens`,
)

const children: Array<{ name: string; proc: ReturnType<typeof Bun.spawn>; out: string }> = []
let aborted = false
let abortReason: string | undefined

for (const [index, group] of groups.entries()) {
  const workerRoot = path.join(base, "workers", `w${index}`)
  const workerData = path.join(workerRoot, "data", "reef")
  await mkdir(workerData, { recursive: true })
  for (const suffix of ["", "-wal", "-shm"]) {
    const from = seedDb + suffix
    if (existsSync(from)) await copyFile(from, path.join(workerData, "opencode-local.db" + suffix))
  }

  const resultFile = path.join(workerRoot, "result.json")
  const dry = args.includes("--dry") ? ["--dry"] : []
  const proc = Bun.spawn(
    [
      process.execPath,
      "run",
      path.join(root, "rig", "runner.ts"),
      ...dry,
      "--tasks",
      group.tasks.join(","),
      "--runs-real",
      String(group.real),
      "--runs-control",
      String(group.control),
      "--runs",
      "1",
      "--model",
      model,
      "--out",
      resultFile,
      "--max-tokens",
      String(Math.round(totalCap / groups.length)),
      "--skip",
      [...done].join(","),
    ],
    {
      cwd: root,
      env: { ...process.env, REEF_RIG_ROOT: workerRoot },
      stdout: "pipe",
      stderr: "pipe",
    },
  )
  children.push({ name: group.name, proc, out: resultFile })

  const pump = async (stream: ReadableStream<Uint8Array> | undefined, tag: string) => {
    if (!stream) return
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ""
      for (const line of lines) if (line.trim()) console.log(`[${tag}] ${line}`)
    }
  }
  void pump(proc.stdout, group.name)
  void pump(proc.stderr, group.name)
}

async function readRows() {
  const files = await Promise.all(
    children.map(async (child) => {
      if (!existsSync(child.out)) return []
      try {
        const data = JSON.parse(await Bun.file(child.out).text())
        return (data.rows ?? []) as Array<{ tokens?: { total?: number }; category?: string; passed?: boolean }>
      } catch {
        return []
      }
    }),
  )
  return files.flat()
}

const monitor = setInterval(async () => {
  if (aborted) return
  const rows = await readRows()
  const total = previousSpent + rows.reduce((sum, row) => sum + (row.tokens?.total ?? 0), 0)
  const worst = rows.reduce((max, row) => Math.max(max, row.tokens?.total ?? 0), 0)
  if (worst > perSessionCap) {
    aborted = true
    abortReason = `single session used ${worst} tokens (cap ${perSessionCap})`
  }
  if (total > totalCap) {
    aborted = true
    abortReason = `suite used ${total} tokens (cap ${totalCap})`
  }
  if (aborted) {
    console.error(`ABORT: ${abortReason}`)
    for (const child of children) child.proc.kill()
  }
}, 5000)

await Promise.all(children.map((child) => child.proc.exited))
clearInterval(monitor)

const freshRows = await readRows()
const merged = new Map<string, Row>()
for (const row of [...previousRows, ...freshRows]) merged.set(`${row.task}:${row.run}`, row)
const rows = [...merged.values()]
const realRows = rows.filter((row) => row.category === "real")
const controlRows = rows.filter((row) => row.category === "control")
const passedReal = realRows.filter((row) => row.passed).length
const controlPassed = controlRows.filter((row) => row.passed).length
const spent = rows.reduce((sum, row) => sum + (row.tokens?.total ?? 0), 0)

const summary = {
  generated: new Date().toISOString(),
  model,
  runs: { real: realRuns, control: controlRuns },
  aborted,
  abortReason,
  spentTokens: spent,
  real: {
    runs: realRows.length,
    passed: passedReal,
    passRate: realRows.length ? passedReal / realRows.length : 0,
  },
  control: { runs: controlRows.length, passed: controlPassed },
  tokensPerPassedRealTask: passedReal > 0 ? Math.round(realRows.reduce((s, r) => s + (r.tokens?.total ?? 0), 0) / passedReal) : null,
  rows,
}

await mkdir(path.dirname(path.resolve(out)), { recursive: true })
await Bun.write(out, JSON.stringify(summary, null, 2) + "\n")

console.log(
  `done: real ${passedReal}/${realRows.length}, control ${controlPassed}/${controlRows.length} (want 0), ` +
    `tokens ${spent}, aborted ${aborted}${abortReason ? ` (${abortReason})` : ""}`,
)
console.log(`wrote ${out}`)
