export interface OldRun { id: string; steps: number }
export function makeRun(id: string, steps: number): OldRun {
  return { id, steps }
}
