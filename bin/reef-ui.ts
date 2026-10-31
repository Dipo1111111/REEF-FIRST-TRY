// Live design loop for the TUI. Runs the app straight from source in this terminal and
// restarts it in place when a source file changes, so a style edit shows up without a
// build or a global install. Ctrl+C quits; edit a file to reload.
//
// Run through bin/reef-ui (sh) or bin/reef-ui.cmd (Windows), which pass the directory
// you started in as PWD so the app still targets that project.
//
// A short trace lands in %TEMP%\reef-ui.log when something goes wrong.

import { appendFileSync, watch } from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const code = path.join(root, "code")
const project = process.env.PWD ?? process.cwd()
const entry = path.join(code, "packages", "cli", "src", "index.ts")
const args = process.argv.slice(2)
const logFile = path.join(process.env.TEMP ?? code, "reef-ui.log")

const log = (message: string) => {
  try {
    appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`)
  } catch {}
}

// Leave the alternate screen and show the cursor again before the next process paints.
const reset = () => process.stdout.write("\x1b[?1049l\x1b[0m\x1b[?25h\x1b[2J\x1b[H")

let generation = 0
let restarting = false
let watchers: Array<{ close: () => void }> = []

const launch = () => {
  const id = ++generation
  const child = Bun.spawn(["bun", "run", entry, "--standalone", ...args], {
    cwd: path.join(code, "packages", "cli"),
    env: { ...process.env, PWD: project },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  })
  log(`launched generation ${id} (pid ${child.pid}) for ${project}`)
  child.exited.then((code) => {
    // A restart kills the old process on purpose; anything else means the user quit.
    if (id !== generation || restarting) return
    log(`app exited with ${code}`)
    watchers.forEach((watcher) => watcher.close())
    reset()
    process.exit(0)
  })
  return child
}

let child = launch()

const restart = async () => {
  if (restarting) return
  restarting = true
  const previous = child
  previous.kill()
  // A Windows kill does not always resolve `exited`, and waiting forever leaves a blank
  // screen. Give the old process a moment, then paint over whatever is left.
  await Promise.race([previous.exited, Bun.sleep(1500)])
  reset()
  child = launch()
  restarting = false
}

let timer: ReturnType<typeof setTimeout> | undefined
const schedule = (file: string) => {
  log(`change: ${file}`)
  clearTimeout(timer)
  timer = setTimeout(restart, 300)
}

// Ignore the burst of events that arrives while the first process is still booting.
setTimeout(() => {
  watchers = [
    watch(path.join(code, "packages"), { recursive: true }, (_event, file) => {
      if (!file) return
      const name = String(file)
      if (!name.endsWith(".ts") && !name.endsWith(".tsx")) return
      if (name.includes("node_modules") || name.includes("dist") || name.includes("test")) return
      schedule(name)
    }),
  ]
}, 2000)

process.on("SIGINT", async () => {
  restarting = true
  watchers.forEach((watcher) => watcher.close())
  child.kill()
  await Promise.race([child.exited, Bun.sleep(1000)])
  reset()
  process.exit(0)
})

// Hold the process open; the app exits through the handler above.
setInterval(() => {}, 1 << 30)
