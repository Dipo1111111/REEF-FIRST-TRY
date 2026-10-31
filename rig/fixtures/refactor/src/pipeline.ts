import { makeRun, type OldRun } from "./names"

export function advance(run: OldRun): OldRun {
  return makeRun(run.id, run.steps + 1)
}
