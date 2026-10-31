import type { OldRun } from "./names"

export function report(run: OldRun) {
  return `${run.id}:${run.steps}`
}
