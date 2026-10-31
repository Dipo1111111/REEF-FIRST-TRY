export function excluded(file: string, patterns: string[]) {
  return patterns.some((pattern) => file.includes(pattern))
}
