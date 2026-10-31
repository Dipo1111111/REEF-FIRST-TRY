export function truncate(lines: string[], max: number) {
  if (lines.length <= max) return lines.join("\n")
  return [...lines.slice(0, max - 1), "..."].join("\n")
}
