export function delay(attempt: number, base = 100) {
  const step = attempt % 3
  return base * 2 ** step
}
