export * as SessionWorkspaceMap from "./workspace-map.js"

import { readdir, readFile } from "node:fs/promises"
import path from "path"
import { Effect } from "effect"

/** Files that tell a model how a repository is built, tested, and organised. */
const LANDMARKS = new Set([
  "AGENTS.md",
  "README.md",
  "package.json",
  "bunfig.toml",
  "tsconfig.json",
  "vitest.config.ts",
  "Makefile",
  "justfile",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
])

const DEPTH = 3
const MAX_LINES = 60

const cache = new Map<string, string>()

/**
 * A one-screen map of the working directory. A model that spends three requests discovering the
 * layout pays more than the map costs, and because the map is computed once per session it also
 * keeps the prompt cache stable.
 */
export const make = (directory: string) =>
  Effect.gen(function* () {
    const cached = cache.get(directory)
    if (cached !== undefined) return cached
    const text = yield* Effect.promise(() => build(directory)).pipe(Effect.orElseSucceed(() => ""))
    cache.set(directory, text)
    return text
  })

/** The map for a directory, when it was already generated. The compaction path reads it synchronously. */
export const known = (directory: string) => cache.get(directory)

const build = async (directory: string) => {
  const lines: string[] = [`Working directory: ${directory}`]
  await walk(directory, lines)
  const scripts = await packageScripts(directory)
  if (scripts.length > 0) lines.push(`package.json scripts: ${scripts.join(", ")}`)
  return lines.join("\n")
}

/** Breadth first, so a monorepo shows every package before any one of them fills the map. */
const walk = async (root: string, lines: string[]) => {
  let level: Array<{ path: string; prefix: string }> = [{ path: root, prefix: "" }]
  for (let depth = 0; depth <= DEPTH && level.length > 0; depth++) {
    const next: Array<{ path: string; prefix: string }> = []
    for (const item of level) {
      const entries = await readdir(item.path, { withFileTypes: true }).catch(() => [])
      for (const entry of entries) {
        if (lines.length >= MAX_LINES) return
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue
        if (entry.isDirectory()) {
          lines.push(`${item.prefix}${entry.name}/`)
          next.push({ path: path.join(item.path, entry.name), prefix: item.prefix + "  " })
          continue
        }
        if (LANDMARKS.has(entry.name)) lines.push(`${item.prefix}${entry.name}`)
      }
    }
    level = next
  }
}

const packageScripts = async (directory: string) => {
  const text = await readFile(path.join(directory, "package.json"), "utf8").catch(() => undefined)
  if (text === undefined) return []
  const parsed = JSON.parse(text) as { scripts?: Record<string, string> }
  return Object.entries(parsed.scripts ?? {})
    .filter(([name]) => ["test", "build", "typecheck", "check", "lint"].includes(name))
    .map(([name, command]) => `${name}=${command}`)
}
