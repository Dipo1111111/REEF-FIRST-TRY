export function encode(events: Array<{ type: string; text?: string }>) {
  return events.map((event) => `{"type":"${event.type}","text":"${event.text ?? ""}"}`).join("\n")
}
