// Reef rig runner.
//
// Runs every task N times against a harness command, records what it cost and
// whether it passed. Plain code on purpose: one file, no framework.
//
//   bun rig/runner.ts --model opencode/deepseek-v4.1-flash-free --runs 1 --out rig/results/smoke.json
//   bun rig/runner.ts --tasks token-usage-total,retry-jitter --runs 1
//
// Flags:
//   --command <path>   harness entry point (default: bin/reef.cmd on Windows, bin/reef otherwise)
//   --model <id>       model passed to `run --model`
//   --runs <n>         repetitions per task (default 1)
//   --out <file>       write the JSON result here
//   --tasks <ids>      comma separated subset
//   --keep             keep run directories for inspection
//   --timeout <sec>    per-run timeout (default: task budget_seconds or 300)

import { existsSync } from "node:fs"
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const args = process.argv.slice(2)
const flag = (name: string) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}
const has = (name: string) => args.includes(name)

const command = flag("--command") ?? path.join(root, "bin", process.platform === "win32" ? "reef.cmd" : "reef")
const model = flag("--model")
const runs = Number(flag("--runs") ?? "1")
const out = flag("--out")
const only = flag("--tasks")?.split(",").filter(Boolean)
const keep = has("--keep")
const dry = has("--dry")

// Run directories must live outside the user profile. Config discovery walks
// every parent of the project, so a temp dir under C:\Users\<name> silently
// inherits that user's .agents/.claude skills and instructions. C:\reef-rig is
// outside the profile on Windows; elsewhere ~/.reef-rig is the default and the
// user is expected to point REEF_RIG_ROOT somewhere neutral.
const rigRoot =
  process.env.REEF_RIG_ROOT ??
  (process.platform === "win32" ? "C:\\reef-rig" : path.join(os.homedir(), ".reef-rig"))

// Hermetic environment for the harness under test: its own home, config, data,
// cache and state. Nothing here touches the user's real OpenCode or Reef data.
const rigHome = path.join(rigRoot, "home")
const rigXdg = {
  data: path.join(rigRoot, "data"),
  config: path.join(rigRoot, "config"),
  cache: path.join(rigRoot, "cache"),
  state: path.join(rigRoot, "state"),
}
await mkdir(path.join(rigRoot, "runs"), { recursive: true })
await mkdir(rigHome, { recursive: true })
await mkdir(path.join(rigXdg.config, "reef"), { recursive: true })
await mkdir(rigXdg.data, { recursive: true })
await mkdir(rigXdg.cache, { recursive: true })
await mkdir(rigXdg.state, { recursive: true })
const seededConfig = path.join(root, "rig", "config", "reef.json")
if (await Bun.file(seededConfig).exists()) {
  await Bun.write(path.join(rigXdg.config, "reef", "reef.json"), await Bun.file(seededConfig).text())
}
const runEnv = {
  HOME: rigHome,
  USERPROFILE: rigHome,
  OPENCODE_TEST_HOME: rigHome,
  XDG_DATA_HOME: rigXdg.data,
  XDG_CONFIG_HOME: rigXdg.config,
  XDG_CACHE_HOME: rigXdg.cache,
  XDG_STATE_HOME: rigXdg.state,
}
const defaultTimeout = Number(flag("--timeout") ?? "300")

const bash = existsSync("C:\\Program Files\\Git\\bin\\bash.exe")
  ? "C:\\Program Files\\Git\\bin\\bash.exe"
  : "bash"

interface Task {
  id: string
  category: "real" | "control"
  expect: "pass" | "fail"
  budget: number
  fixture: string
  prompt: string
}

// Minimal YAML: flat keys plus one `prompt: |` block. Enough for task.yaml and
// small enough to read in one sitting.
function parseTask(file: string, text: string): Task {
  const lines = text.split(/\r?\n/)
  const flat: Record<string, string> = {}
  let prompt: string[] | undefined
  let inPrompt = false
  for (const line of lines) {
    if (inPrompt) {
      if (/^\s{2,}/.test(line) || line.trim() === "") {
        prompt!.push(line.replace(/^ {2}/, ""))
        continue
      }
      inPrompt = false
    }
    const match = line.match(/^([a-z_]+):\s*(.*)$/)
    if (!match) continue
    if (match[2] === "|") {
      prompt = []
      inPrompt = true
      continue
    }
    flat[match[1]] = match[2]
  }
  const id = flat.id ?? path.basename(path.dirname(file))
  const category = flat.category === "control" ? "control" : "real"
  return {
    id,
    category,
    expect: flat.expect === "fail" ? "fail" : "pass",
    budget: Number(flat.budget_seconds ?? defaultTimeout),
    fixture: flat.fixture ?? id,
    prompt: (prompt ?? []).join("\n").trim(),
  }
}

async function loadTasks(): Promise<Task[]> {
  const dir = path.join(root, "rig", "tasks")
  const entries = await readdir(dir, { withFileTypes: true })
  const found = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const file = path.join(dir, entry.name, "task.yaml")
        const text = await Bun.file(file).text()
        return parseTask(file, text)
      }),
  )
  return found.filter((task) => !only || only.includes(task.id)).sort((a, b) => a.id.localeCompare(b.id))
}

function shell(command: string, cwd: string, env: Record<string, string>, timeoutMs: number) {
  const child = Bun.spawn([bash, "-c", command], {
    cwd,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
    timeout: timeoutMs,
  })
  return Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]).then(
    ([stdout, stderr, code]) => ({ stdout, stderr, code }),
  )
}

async function runTask(task: Task, run: number) {
  const dir = await mkdtemp(path.join(rigRoot, "runs", `${task.id}-`))
  const fixture = path.join(root, "rig", "fixtures", task.fixture)
  const taskDir = path.join(root, "rig", "tasks", task.id)
  const timeoutMs = task.budget * 1000
  const started = Date.now()

  const setup = await shell("bash setup.sh", taskDir, { RUN_DIR: dir, FIXTURE_DIR: fixture }, 60_000)
  if (setup.code !== 0) {
    return {
      task: task.id,
      category: task.category,
      expect: task.expect,
      run,
      passed: false,
      cost: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      modelCalls: 0,
      toolCalls: 0,
      wallMs: Date.now() - started,
      error: `setup failed: ${setup.stderr}`.slice(0, 2000),
    }
  }

  const tokens = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  let cost = 0
  let modelCalls = 0
  let toolCalls = 0
  let error: string | undefined
  let exitCode = 0
  if (!dry) {
    const harnessArgs = [
      "run",
      "--standalone",
      "--format",
      "json",
      ...(model ? ["--model", model] : []),
      task.prompt,
    ]
    const harness = Bun.spawn([command, ...harnessArgs], {
      cwd: dir,
      env: {
        ...process.env,
        ...runEnv,
        PWD: dir,
        REEF_RIG: "1",
        NO_COLOR: "1",
      },
      stdout: "pipe",
      stderr: "pipe",
      timeout: timeoutMs,
    })

    const [stdout, , exitCodeResult] = await Promise.all([
      new Response(harness.stdout).text(),
      new Response(harness.stderr).text(),
      harness.exited,
    ])
    exitCode = exitCodeResult

    for (const line of stdout.split(/\r?\n/)) {
      if (!line.trim().startsWith("{")) continue
      try {
        const event = JSON.parse(line)
        if (event.type === "step_finish") {
          modelCalls += 1
          cost += event.part?.cost ?? 0
          const t = event.part?.tokens ?? {}
          tokens.input += t.input ?? 0
          tokens.output += t.output ?? 0
          tokens.reasoning += t.reasoning ?? 0
          tokens.cacheRead += t.cache?.read ?? 0
          tokens.cacheWrite += t.cache?.write ?? 0
        }
        if (event.type === "tool") toolCalls += 1
        if (event.type === "error") error = event.error?.message ?? JSON.stringify(event.error)
      } catch {}
    }
  }
  tokens.total = tokens.input + tokens.output + tokens.reasoning + tokens.cacheRead + tokens.cacheWrite

  const accept = await shell("bash accept.sh", taskDir, { RUN_DIR: dir }, 120_000)
  const acceptCode = accept.code
  const acceptOut = (accept.stdout + accept.stderr).trim()

  const row = {
    task: task.id,
    category: task.category,
    expect: task.expect,
    run,
    passed: acceptCode === 0,
    cost,
    tokens,
    modelCalls,
    toolCalls,
    wallMs: Date.now() - started,
    exitCode,
    accept: acceptOut.slice(-2000),
    error,
    dir: keep ? dir : undefined,
  }
  if (!keep) await rm(dir, { recursive: true, force: true }).catch(() => {})
  return row
}

const tasks = await loadTasks()
if (!tasks.length) {
  console.error("no tasks found")
  process.exit(2)
}

const rows = []
for (const task of tasks) {
  for (let run = 0; run < runs; run++) {
    process.stdout.write(`${task.id} run ${run + 1}/${runs} ... `)
    const row = await runTask(task, run)
    rows.push(row)
    process.stdout.write(`${row.passed ? "pass" : "fail"} ${row.wallMs}ms ${row.tokens.total}tok\n`)
  }
}

const real = rows.filter((row) => row.category === "real")
const control = rows.filter((row) => row.category === "control")
const passedReal = real.filter((row) => row.passed).length
const controlPassed = control.filter((row) => row.passed).length
const summary = {
  generated: new Date().toISOString(),
  command,
  model: model ?? "default",
  runs,
  tasks: tasks.length,
  real: { runs: real.length, passed: passedReal, passRate: real.length ? passedReal / real.length : 0 },
  control: { runs: control.length, passed: controlPassed },
  tokensPerPassedRealTask:
    passedReal > 0 ? Math.round(real.reduce((sum, row) => sum + row.tokens.total, 0) / passedReal) : null,
  rows,
}

if (out) {
  await mkdir(path.dirname(path.resolve(out)), { recursive: true })
  await Bun.write(out, JSON.stringify(summary, null, 2) + "\n")
  console.log(`wrote ${out}`)
}

console.log(
  `real ${passedReal}/${real.length} passed, control ${controlPassed}/${control.length} passed (want 0), ` +
    `tokens/pass ${summary.tokensPerPassedRealTask ?? "n/a"}`,
)
