export interface Tokens {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export function total(tokens: Tokens) {
  return tokens.input + tokens.output + tokens.cache.read + tokens.cache.write
}
