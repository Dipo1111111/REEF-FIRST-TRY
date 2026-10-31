export function merge(files: Array<{ order: number; value: Record<string, unknown> }>) {
  return files.reduce<Record<string, unknown>>((acc, file) => ({ ...file.value, ...acc }), {})
}
