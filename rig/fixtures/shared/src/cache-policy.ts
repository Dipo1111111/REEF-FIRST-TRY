export const MARKER_CAP = 5

export function markers(steps: number) {
  return Math.min(steps, MARKER_CAP)
}
