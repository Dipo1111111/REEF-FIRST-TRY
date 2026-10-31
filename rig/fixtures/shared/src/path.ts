export function normalize(input: string) {
  return input.replaceAll("\\", "/").replace("//", "/")
}
