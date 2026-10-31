export function title(message: string) {
  const text = message.trim()
  if (text.length < 3) return ""
  return text.slice(0, 60)
}
